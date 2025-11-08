"""
GitHub API Service - Comprehensive REST API integration
Handles all GitHub API interactions with rate limiting, retries, and circuit breaker
"""
import httpx
import asyncio
import base64
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import logging
from enum import Enum

from app.core.config import settings

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    """Circuit breaker pattern implementation"""

    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.state = CircuitState.CLOSED

    def record_success(self):
        """Record a successful call"""
        self.failure_count = 0
        self.state = CircuitState.CLOSED

    def record_failure(self):
        """Record a failed call"""
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.warning(f"Circuit breaker opened after {self.failure_count} failures")

    def can_attempt(self) -> bool:
        """Check if a request can be attempted"""
        if self.state == CircuitState.CLOSED:
            return True

        if self.state == CircuitState.OPEN:
            if self.last_failure_time and \
               (datetime.utcnow() - self.last_failure_time).seconds >= self.timeout:
                self.state = CircuitState.HALF_OPEN
                logger.info("Circuit breaker entering half-open state")
                return True
            return False

        # HALF_OPEN state
        return True


class GitHubRateLimiter:
    """GitHub API rate limit tracker"""

    def __init__(self):
        self.limit: Optional[int] = None
        self.remaining: Optional[int] = None
        self.reset_at: Optional[datetime] = None
        self.is_limited = False

    def update_from_headers(self, headers: Dict[str, str]):
        """Update rate limit info from response headers"""
        try:
            self.limit = int(headers.get("X-RateLimit-Limit", 0))
            self.remaining = int(headers.get("X-RateLimit-Remaining", 0))
            reset_timestamp = int(headers.get("X-RateLimit-Reset", 0))
            self.reset_at = datetime.fromtimestamp(reset_timestamp) if reset_timestamp else None

            # Check if we're approaching the limit
            if self.remaining is not None and self.remaining < 10:
                self.is_limited = True
                logger.warning(f"GitHub API rate limit low: {self.remaining} remaining")
            else:
                self.is_limited = False

        except (ValueError, TypeError) as e:
            logger.error(f"Error parsing rate limit headers: {e}")

    async def wait_if_needed(self):
        """Wait if we're rate limited"""
        if self.is_limited and self.reset_at:
            wait_seconds = (self.reset_at - datetime.utcnow()).total_seconds()
            if wait_seconds > 0:
                logger.info(f"Rate limited. Waiting {wait_seconds} seconds until reset")
                await asyncio.sleep(min(wait_seconds, 60))  # Max wait 60s at a time

    def get_status(self) -> Dict[str, Any]:
        """Get current rate limit status"""
        return {
            "limit": self.limit,
            "remaining": self.remaining,
            "reset_at": self.reset_at.isoformat() if self.reset_at else None,
            "is_limited": self.is_limited
        }


class GitHubService:
    """
    Comprehensive GitHub API Service
    Handles all GitHub REST API interactions with:
    - Rate limiting
    - Retry logic with exponential backoff
    - Circuit breaker pattern
    - Request caching
    """

    def __init__(self):
        self.base_url = settings.GITHUB_API_URL
        self.rate_limiter = GitHubRateLimiter()
        self.circuit_breaker = CircuitBreaker()
        self.client: Optional[httpx.AsyncClient] = None

    async def get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self.client is None:
            self.client = httpx.AsyncClient(
                timeout=30.0,
                limits=httpx.Limits(max_keepalive_connections=10, max_connections=20)
            )
        return self.client

    async def close(self):
        """Close HTTP client"""
        if self.client:
            await self.client.aclose()
            self.client = None

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        token: Optional[str] = None,
        params: Optional[Dict] = None,
        json_data: Optional[Dict] = None,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Make an API request with retry logic and circuit breaker
        """
        if not self.circuit_breaker.can_attempt():
            raise Exception("Circuit breaker is open. Service temporarily unavailable.")

        # Wait if rate limited
        await self.rate_limiter.wait_if_needed()

        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "RepoNexus/1.0"
        }

        if token:
            headers["Authorization"] = f"token {token}"

        url = f"{self.base_url}{endpoint}"
        client = await self.get_client()

        for attempt in range(max_retries):
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=headers,
                    params=params,
                    json=json_data
                )

                # Update rate limit info
                self.rate_limiter.update_from_headers(dict(response.headers))

                # Handle different status codes
                if response.status_code == 200 or response.status_code == 201:
                    self.circuit_breaker.record_success()
                    return response.json()

                elif response.status_code == 204:  # No content (successful delete/star)
                    self.circuit_breaker.record_success()
                    return {"success": True}

                elif response.status_code == 404:
                    self.circuit_breaker.record_success()
                    raise Exception(f"Resource not found: {endpoint}")

                elif response.status_code == 403:
                    # Rate limit exceeded
                    if "rate limit" in response.text.lower():
                        self.rate_limiter.is_limited = True
                        await self.rate_limiter.wait_if_needed()
                        continue
                    raise Exception(f"Forbidden: {response.text}")

                elif response.status_code == 401:
                    raise Exception("Unauthorized: Invalid or missing token")

                elif response.status_code >= 500:
                    # Server error - retry with backoff
                    wait_time = 2 ** attempt
                    logger.warning(f"Server error {response.status_code}. Retrying in {wait_time}s")
                    await asyncio.sleep(wait_time)
                    continue

                else:
                    raise Exception(f"Unexpected status {response.status_code}: {response.text}")

            except httpx.TimeoutException:
                logger.warning(f"Request timeout on attempt {attempt + 1}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                self.circuit_breaker.record_failure()
                raise Exception("Request timeout after retries")

            except httpx.RequestError as e:
                logger.error(f"Request error: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                self.circuit_breaker.record_failure()
                raise Exception(f"Request failed: {str(e)}")

        self.circuit_breaker.record_failure()
        raise Exception("Max retries exceeded")

    # ==================== User Methods ====================

    async def fetch_user(self, username: str) -> Dict[str, Any]:
        """Fetch a GitHub user by username"""
        logger.info(f"Fetching user: {username}")
        return await self._make_request("GET", f"/users/{username}")

    async def fetch_authenticated_user(self, token: str) -> Dict[str, Any]:
        """Fetch the authenticated user's profile"""
        logger.info("Fetching authenticated user")
        return await self._make_request("GET", "/user", token=token)

    # ==================== Repository Methods ====================

    async def fetch_repository(self, owner: str, name: str) -> Dict[str, Any]:
        """Fetch a specific repository"""
        logger.info(f"Fetching repository: {owner}/{name}")
        return await self._make_request("GET", f"/repos/{owner}/{name}")

    async def fetch_repositories(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Fetch repositories with parameters
        params can include: type, sort, direction, per_page, page
        """
        logger.info(f"Fetching repositories with params: {params}")
        return await self._make_request("GET", "/repositories", params=params)

    async def search_repositories(
        self,
        query: str,
        page: int = 1,
        per_page: int = 30,
        sort: str = "stars"
    ) -> Dict[str, Any]:
        """
        Search repositories on GitHub
        """
        logger.info(f"Searching repositories: {query}")
        params = {
            "q": query,
            "page": page,
            "per_page": per_page,
            "sort": sort,
            "order": "desc"
        }
        return await self._make_request("GET", "/search/repositories", params=params)

    async def fetch_readme(self, owner: str, name: str) -> str:
        """
        Fetch and decode repository README
        """
        logger.info(f"Fetching README: {owner}/{name}")
        try:
            data = await self._make_request("GET", f"/repos/{owner}/{name}/readme")

            # Decode base64 content
            if "content" in data:
                content_base64 = data["content"].replace("\n", "")
                decoded = base64.b64decode(content_base64).decode("utf-8")
                return decoded

            return ""
        except Exception as e:
            logger.warning(f"Could not fetch README for {owner}/{name}: {e}")
            return ""

    async def fetch_languages(self, owner: str, name: str) -> Dict[str, int]:
        """
        Fetch repository languages with byte counts
        Returns: {"Python": 12345, "JavaScript": 6789}
        """
        logger.info(f"Fetching languages: {owner}/{name}")
        try:
            return await self._make_request("GET", f"/repos/{owner}/{name}/languages")
        except Exception as e:
            logger.warning(f"Could not fetch languages for {owner}/{name}: {e}")
            return {}

    async def fetch_contributors(
        self,
        owner: str,
        name: str,
        per_page: int = 30
    ) -> List[Dict[str, Any]]:
        """Fetch repository contributors"""
        logger.info(f"Fetching contributors: {owner}/{name}")
        try:
            params = {"per_page": per_page, "page": 1}
            return await self._make_request("GET", f"/repos/{owner}/{name}/contributors", params=params)
        except Exception as e:
            logger.warning(f"Could not fetch contributors for {owner}/{name}: {e}")
            return []

    async def star_repository(self, owner: str, name: str, token: str) -> bool:
        """Star a repository"""
        logger.info(f"Starring repository: {owner}/{name}")
        try:
            await self._make_request("PUT", f"/user/starred/{owner}/{name}", token=token)
            return True
        except Exception as e:
            logger.error(f"Failed to star {owner}/{name}: {e}")
            return False

    async def unstar_repository(self, owner: str, name: str, token: str) -> bool:
        """Unstar a repository"""
        logger.info(f"Unstarring repository: {owner}/{name}")
        try:
            await self._make_request("DELETE", f"/user/starred/{owner}/{name}", token=token)
            return True
        except Exception as e:
            logger.error(f"Failed to unstar {owner}/{name}: {e}")
            return False

    async def check_starred(self, owner: str, name: str, token: str) -> bool:
        """Check if user has starred a repository"""
        try:
            await self._make_request("GET", f"/user/starred/{owner}/{name}", token=token)
            return True
        except:
            return False

    async def fetch_user_repositories(
        self,
        username: str,
        type: str = "all",
        sort: str = "updated",
        per_page: int = 30,
        page: int = 1
    ) -> List[Dict[str, Any]]:
        """Fetch repositories for a user"""
        logger.info(f"Fetching repositories for user: {username}")
        params = {
            "type": type,
            "sort": sort,
            "per_page": per_page,
            "page": page
        }
        return await self._make_request("GET", f"/users/{username}/repos", params=params)

    # ==================== Trending Methods ====================

    async def fetch_trending(
        self,
        period: str = "daily",
        language: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch trending repositories by scraping GitHub trending page
        GitHub doesn't provide an official API for trending
        """
        logger.info(f"Fetching trending repositories: period={period}, language={language}")

        try:
            # Build trending URL
            base_url = "https://github.com/trending"
            if language:
                base_url += f"/{language}"

            params = {}
            if period in ["daily", "weekly", "monthly"]:
                if period == "weekly":
                    params["since"] = "weekly"
                elif period == "monthly":
                    params["since"] = "monthly"

            # Make request with httpx
            client = await self.get_client()
            response = await client.get(base_url, params=params)

            if response.status_code != 200:
                logger.error(f"Failed to fetch trending page: {response.status_code}")
                return []

            # Parse HTML
            soup = BeautifulSoup(response.text, "html.parser")
            repositories = []

            # Find repository articles
            articles = soup.find_all("article", class_="Box-row")

            for article in articles:
                try:
                    # Extract repository name
                    h2 = article.find("h2")
                    if not h2:
                        continue

                    link = h2.find("a")
                    if not link:
                        continue

                    href = link.get("href", "")
                    parts = href.strip("/").split("/")
                    if len(parts) < 2:
                        continue

                    owner, name = parts[0], parts[1]

                    # Extract description
                    desc_elem = article.find("p", class_="col-9")
                    description = desc_elem.get_text(strip=True) if desc_elem else ""

                    # Extract language
                    lang_elem = article.find("span", attrs={"itemprop": "programmingLanguage"})
                    language_name = lang_elem.get_text(strip=True) if lang_elem else None

                    # Extract stars
                    stars_elem = article.find("svg", class_="octicon-star")
                    stars = 0
                    if stars_elem and stars_elem.parent:
                        stars_text = stars_elem.parent.get_text(strip=True)
                        stars_text = stars_text.replace(",", "").replace("k", "000")
                        try:
                            stars = int(stars_text)
                        except:
                            pass

                    # Extract stars today
                    stars_today_elem = article.find("svg", class_="octicon-star")
                    if stars_today_elem:
                        parent = stars_today_elem.find_parent("span")
                        if parent:
                            next_span = parent.find_next("span")
                            if next_span:
                                stars_today_text = next_span.get_text(strip=True)
                                # Parse "123 stars today"
                                stars_today = 0
                                try:
                                    stars_today = int(stars_today_text.split()[0].replace(",", ""))
                                except:
                                    pass

                    repo_data = {
                        "owner": owner,
                        "name": name,
                        "full_name": f"{owner}/{name}",
                        "description": description,
                        "language": language_name,
                        "stars": stars,
                        "url": f"https://github.com{href}"
                    }

                    repositories.append(repo_data)

                except Exception as e:
                    logger.warning(f"Error parsing trending repository: {e}")
                    continue

            logger.info(f"Parsed {len(repositories)} trending repositories")
            return repositories

        except Exception as e:
            logger.error(f"Failed to fetch trending repositories: {e}")
            return []

    # ==================== Topic Methods ====================

    async def fetch_topics(self, per_page: int = 100) -> List[str]:
        """
        Fetch popular GitHub topics
        Note: This is a simplified version. GitHub doesn't have a direct topics API
        """
        logger.info("Fetching popular topics")

        # Common popular topics as fallback
        popular_topics = [
            "javascript", "python", "java", "typescript", "react", "vue",
            "angular", "nodejs", "machine-learning", "deep-learning",
            "artificial-intelligence", "data-science", "web-development",
            "mobile", "ios", "android", "flutter", "react-native",
            "docker", "kubernetes", "devops", "cloud", "aws", "azure",
            "frontend", "backend", "fullstack", "api", "rest", "graphql"
        ]

        return popular_topics

    async def search_topics(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for topics
        Uses repository topic search as proxy
        """
        logger.info(f"Searching topics: {query}")
        try:
            result = await self.search_repositories(f"topic:{query}", per_page=10)

            topics = []
            if "items" in result:
                for repo in result["items"]:
                    if "topics" in repo:
                        for topic in repo["topics"]:
                            if query.lower() in topic.lower():
                                topics.append({"name": topic})

            # Deduplicate
            seen = set()
            unique_topics = []
            for topic in topics:
                if topic["name"] not in seen:
                    seen.add(topic["name"])
                    unique_topics.append(topic)

            return unique_topics

        except Exception as e:
            logger.error(f"Failed to search topics: {e}")
            return []

    async def fetch_repositories_by_topic(
        self,
        topic: str,
        page: int = 1,
        per_page: int = 30
    ) -> Dict[str, Any]:
        """Fetch repositories for a specific topic"""
        logger.info(f"Fetching repositories for topic: {topic}")
        return await self.search_repositories(
            query=f"topic:{topic}",
            page=page,
            per_page=per_page
        )

    # ==================== Utility Methods ====================

    def get_rate_limit_status(self) -> Dict[str, Any]:
        """Get current rate limit status"""
        return self.rate_limiter.get_status()

    def reset_circuit_breaker(self):
        """Manually reset circuit breaker"""
        self.circuit_breaker.failure_count = 0
        self.circuit_breaker.state = CircuitState.CLOSED
        logger.info("Circuit breaker manually reset")

    async def execute_graphql(
        self,
        query: str,
        variables: Optional[Dict[str, Any]] = None,
        token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute a GraphQL query against GitHub's GraphQL API

        Args:
            query: GraphQL query string
            variables: Query variables
            token: GitHub access token

        Returns:
            Query result data
        """
        from app.services.github_graphql import get_github_graphql_client

        graphql_client = get_github_graphql_client()

        try:
            result = await graphql_client.query(query, variables, token)
            return result
        except Exception as e:
            logger.error(f"GraphQL query failed: {e}")
            return {}


# Singleton instance
_github_service: Optional[GitHubService] = None


def get_github_service() -> GitHubService:
    """Get or create GitHubService singleton"""
    global _github_service
    if _github_service is None:
        _github_service = GitHubService()
    return _github_service
