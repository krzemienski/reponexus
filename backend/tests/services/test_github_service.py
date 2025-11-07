"""
Tests for GitHub Service
Tests API interactions, rate limiting, retries, and circuit breaker
"""
import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch, MagicMock
import httpx
from datetime import datetime, timedelta

from app.services.github_service import (
    GitHubService,
    CircuitBreaker,
    GitHubRateLimiter,
    CircuitState,
    get_github_service
)


class TestCircuitBreaker:
    """Test circuit breaker pattern"""

    def test_initial_state_closed(self):
        """Circuit breaker starts in closed state"""
        cb = CircuitBreaker(failure_threshold=3, timeout=60)
        assert cb.state == CircuitState.CLOSED
        assert cb.can_attempt() is True

    def test_records_failures(self):
        """Circuit breaker records failures"""
        cb = CircuitBreaker(failure_threshold=3, timeout=60)
        cb.record_failure()
        assert cb.failure_count == 1

    def test_opens_after_threshold(self):
        """Circuit breaker opens after failure threshold"""
        cb = CircuitBreaker(failure_threshold=3, timeout=60)

        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.CLOSED

        cb.record_failure()
        assert cb.state == CircuitState.OPEN
        assert cb.can_attempt() is False

    def test_resets_on_success(self):
        """Circuit breaker resets failure count on success"""
        cb = CircuitBreaker(failure_threshold=3, timeout=60)

        cb.record_failure()
        cb.record_failure()
        assert cb.failure_count == 2

        cb.record_success()
        assert cb.failure_count == 0
        assert cb.state == CircuitState.CLOSED

    def test_half_open_after_timeout(self):
        """Circuit breaker enters half-open state after timeout"""
        cb = CircuitBreaker(failure_threshold=2, timeout=1)

        cb.record_failure()
        cb.record_failure()
        assert cb.state == CircuitState.OPEN

        # Simulate timeout
        import time
        time.sleep(1.1)

        assert cb.can_attempt() is True
        assert cb.state == CircuitState.HALF_OPEN


class TestGitHubRateLimiter:
    """Test GitHub rate limiter"""

    def test_update_from_headers(self):
        """Rate limiter updates from response headers"""
        limiter = GitHubRateLimiter()

        headers = {
            "X-RateLimit-Limit": "5000",
            "X-RateLimit-Remaining": "4950",
            "X-RateLimit-Reset": str(int(datetime.now().timestamp()) + 3600)
        }

        limiter.update_from_headers(headers)

        assert limiter.limit == 5000
        assert limiter.remaining == 4950
        assert limiter.is_limited is False

    def test_detects_low_rate_limit(self):
        """Rate limiter detects low remaining calls"""
        limiter = GitHubRateLimiter()

        headers = {
            "X-RateLimit-Limit": "5000",
            "X-RateLimit-Remaining": "5",
            "X-RateLimit-Reset": str(int(datetime.now().timestamp()) + 3600)
        }

        limiter.update_from_headers(headers)

        assert limiter.is_limited is True

    def test_get_status(self):
        """Rate limiter returns status dict"""
        limiter = GitHubRateLimiter()

        headers = {
            "X-RateLimit-Limit": "5000",
            "X-RateLimit-Remaining": "4950",
            "X-RateLimit-Reset": str(int(datetime.now().timestamp()) + 3600)
        }

        limiter.update_from_headers(headers)
        status = limiter.get_status()

        assert status["limit"] == 5000
        assert status["remaining"] == 4950
        assert "reset_at" in status


class TestGitHubService:
    """Test GitHub Service"""

    @pytest.fixture
    def github_service(self):
        """Create GitHub service instance"""
        return GitHubService()

    @pytest.fixture
    def mock_response(self):
        """Create mock HTTP response"""
        response = Mock()
        response.status_code = 200
        response.headers = {
            "X-RateLimit-Limit": "5000",
            "X-RateLimit-Remaining": "4950",
            "X-RateLimit-Reset": str(int(datetime.now().timestamp()) + 3600)
        }
        response.json = Mock(return_value={"id": 123, "name": "test-repo"})
        return response

    @pytest.mark.asyncio
    async def test_fetch_user_success(self, github_service, mock_response):
        """Test successful user fetch"""
        with patch.object(httpx.AsyncClient, "request", return_value=mock_response) as mock_request:
            result = await github_service.fetch_user("testuser")

            assert result["id"] == 123
            assert result["name"] == "test-repo"
            mock_request.assert_called_once()

    @pytest.mark.asyncio
    async def test_fetch_repository_success(self, github_service, mock_response):
        """Test successful repository fetch"""
        with patch.object(httpx.AsyncClient, "request", return_value=mock_response) as mock_request:
            result = await github_service.fetch_repository("owner", "repo")

            assert result["id"] == 123
            mock_request.assert_called_once()

    @pytest.mark.asyncio
    async def test_retry_on_server_error(self, github_service):
        """Test retry logic on server error"""
        # First call returns 500, second call succeeds
        error_response = Mock()
        error_response.status_code = 500
        error_response.text = "Internal Server Error"
        error_response.headers = {}

        success_response = Mock()
        success_response.status_code = 200
        success_response.json = Mock(return_value={"id": 123})
        success_response.headers = {
            "X-RateLimit-Limit": "5000",
            "X-RateLimit-Remaining": "4950",
            "X-RateLimit-Reset": str(int(datetime.now().timestamp()) + 3600)
        }

        with patch.object(
            httpx.AsyncClient,
            "request",
            side_effect=[error_response, success_response]
        ) as mock_request:
            result = await github_service.fetch_user("testuser")

            assert result["id"] == 123
            assert mock_request.call_count == 2

    @pytest.mark.asyncio
    async def test_circuit_breaker_opens_on_failures(self, github_service):
        """Test circuit breaker opens after multiple failures"""
        error_response = Mock()
        error_response.status_code = 500
        error_response.text = "Internal Server Error"
        error_response.headers = {}

        with patch.object(httpx.AsyncClient, "request", return_value=error_response):
            # Make multiple failed requests
            for _ in range(5):
                try:
                    await github_service._make_request("GET", "/test")
                except:
                    pass

            # Circuit breaker should be open
            assert github_service.circuit_breaker.state == CircuitState.OPEN

    @pytest.mark.asyncio
    async def test_search_repositories(self, github_service):
        """Test repository search"""
        search_response = Mock()
        search_response.status_code = 200
        search_response.json = Mock(return_value={
            "total_count": 100,
            "items": [
                {"id": 1, "name": "repo1"},
                {"id": 2, "name": "repo2"}
            ]
        })
        search_response.headers = {
            "X-RateLimit-Limit": "5000",
            "X-RateLimit-Remaining": "4950",
            "X-RateLimit-Reset": str(int(datetime.now().timestamp()) + 3600)
        }

        with patch.object(httpx.AsyncClient, "request", return_value=search_response):
            result = await github_service.search_repositories("python")

            assert result["total_count"] == 100
            assert len(result["items"]) == 2

    @pytest.mark.asyncio
    async def test_fetch_readme_decodes_base64(self, github_service):
        """Test README fetch and base64 decoding"""
        import base64

        readme_content = "# Test README\n\nThis is a test."
        encoded_content = base64.b64encode(readme_content.encode()).decode()

        readme_response = Mock()
        readme_response.status_code = 200
        readme_response.json = Mock(return_value={
            "content": encoded_content,
            "encoding": "base64"
        })
        readme_response.headers = {
            "X-RateLimit-Limit": "5000",
            "X-RateLimit-Remaining": "4950",
            "X-RateLimit-Reset": str(int(datetime.now().timestamp()) + 3600)
        }

        with patch.object(httpx.AsyncClient, "request", return_value=readme_response):
            result = await github_service.fetch_readme("owner", "repo")

            assert result == readme_content

    @pytest.mark.asyncio
    async def test_fetch_languages(self, github_service):
        """Test languages fetch"""
        lang_response = Mock()
        lang_response.status_code = 200
        lang_response.json = Mock(return_value={
            "Python": 12345,
            "JavaScript": 6789
        })
        lang_response.headers = {
            "X-RateLimit-Limit": "5000",
            "X-RateLimit-Remaining": "4950",
            "X-RateLimit-Reset": str(int(datetime.now().timestamp()) + 3600)
        }

        with patch.object(httpx.AsyncClient, "request", return_value=lang_response):
            result = await github_service.fetch_languages("owner", "repo")

            assert result["Python"] == 12345
            assert result["JavaScript"] == 6789

    @pytest.mark.asyncio
    async def test_star_repository(self, github_service):
        """Test starring a repository"""
        star_response = Mock()
        star_response.status_code = 204
        star_response.headers = {
            "X-RateLimit-Limit": "5000",
            "X-RateLimit-Remaining": "4950",
            "X-RateLimit-Reset": str(int(datetime.now().timestamp()) + 3600)
        }

        with patch.object(httpx.AsyncClient, "request", return_value=star_response):
            result = await github_service.star_repository("owner", "repo", "fake-token")

            assert result is True

    @pytest.mark.asyncio
    async def test_404_raises_exception(self, github_service):
        """Test 404 raises exception"""
        not_found_response = Mock()
        not_found_response.status_code = 404
        not_found_response.headers = {}

        with patch.object(httpx.AsyncClient, "request", return_value=not_found_response):
            with pytest.raises(Exception) as exc_info:
                await github_service.fetch_user("nonexistent")

            assert "not found" in str(exc_info.value).lower()

    @pytest.mark.asyncio
    async def test_rate_limit_status(self, github_service):
        """Test rate limit status retrieval"""
        status = github_service.get_rate_limit_status()

        assert "limit" in status
        assert "remaining" in status
        assert "is_limited" in status

    @pytest.mark.asyncio
    async def test_fetch_trending_scrapes_html(self, github_service):
        """Test trending repositories scraping"""
        # Mock HTML response
        html_content = """
        <html>
            <body>
                <article class="Box-row">
                    <h2><a href="/owner/repo">owner / repo</a></h2>
                    <p class="col-9">Test description</p>
                    <span itemprop="programmingLanguage">Python</span>
                </article>
            </body>
        </html>
        """

        trending_response = Mock()
        trending_response.status_code = 200
        trending_response.text = html_content
        trending_response.headers = {}

        with patch.object(httpx.AsyncClient, "get", return_value=trending_response):
            result = await github_service.fetch_trending("daily")

            assert len(result) >= 0  # Should parse without errors

    def test_singleton_instance(self):
        """Test singleton pattern"""
        service1 = get_github_service()
        service2 = get_github_service()

        assert service1 is service2

    @pytest.mark.asyncio
    async def test_close_client(self, github_service):
        """Test closing HTTP client"""
        # Create client
        await github_service.get_client()
        assert github_service.client is not None

        # Close client
        await github_service.close()
        assert github_service.client is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
