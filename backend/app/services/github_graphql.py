"""
GitHub GraphQL API Client
Provides efficient queries using GitHub's GraphQL v4 API for bulk data operations
"""
import httpx
import logging
from typing import Optional, Dict, List, Any

from app.core.config import settings

logger = logging.getLogger(__name__)


class GitHubGraphQLClient:
    """
    GitHub GraphQL v4 API Client
    More efficient for bulk operations and complex queries
    """

    def __init__(self):
        self.endpoint = "https://api.github.com/graphql"
        self.client: Optional[httpx.AsyncClient] = None

    async def get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client"""
        if self.client is None:
            self.client = httpx.AsyncClient(timeout=30.0)
        return self.client

    async def close(self):
        """Close HTTP client"""
        if self.client:
            await self.client.aclose()
            self.client = None

    async def query(
        self,
        query: str,
        variables: Optional[Dict[str, Any]] = None,
        token: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Execute a GraphQL query
        """
        headers = {
            "Accept": "application/vnd.github.v4+json",
            "User-Agent": "RepoNexus/1.0"
        }

        if token:
            headers["Authorization"] = f"bearer {token}"

        payload = {"query": query}
        if variables:
            payload["variables"] = variables

        try:
            client = await self.get_client()
            response = await client.post(
                self.endpoint,
                headers=headers,
                json=payload
            )

            if response.status_code != 200:
                logger.error(f"GraphQL query failed: {response.status_code} - {response.text}")
                raise Exception(f"GraphQL query failed: {response.status_code}")

            data = response.json()

            # Check for errors
            if "errors" in data:
                logger.error(f"GraphQL errors: {data['errors']}")
                raise Exception(f"GraphQL errors: {data['errors']}")

            return data.get("data", {})

        except httpx.RequestError as e:
            logger.error(f"GraphQL request error: {e}")
            raise Exception(f"GraphQL request failed: {str(e)}")

    # ==================== User Queries ====================

    async def fetch_user_with_repos(
        self,
        username: str,
        first: int = 10,
        after: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch user data with their repositories
        """
        query = """
        query($username: String!, $first: Int!, $after: String) {
          user(login: $username) {
            id
            login
            name
            email
            avatarUrl
            bio
            company
            location
            websiteUrl
            twitterUsername
            followers {
              totalCount
            }
            following {
              totalCount
            }
            repositories(
              first: $first
              after: $after
              orderBy: {field: UPDATED_AT, direction: DESC}
              privacy: PUBLIC
            ) {
              totalCount
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                id
                name
                nameWithOwner
                description
                isPrivate
                isFork
                isArchived
                stargazerCount
                forkCount
                watchers {
                  totalCount
                }
                primaryLanguage {
                  name
                  color
                }
                languages(first: 10) {
                  edges {
                    size
                    node {
                      name
                    }
                  }
                }
                repositoryTopics(first: 10) {
                  nodes {
                    topic {
                      name
                    }
                  }
                }
                url
                createdAt
                updatedAt
                pushedAt
              }
            }
          }
        }
        """

        variables = {
            "username": username,
            "first": first,
            "after": after
        }

        return await self.query(query, variables)

    async def fetch_user_stats(self, username: str) -> Dict[str, Any]:
        """
        Fetch user statistics
        """
        query = """
        query($username: String!) {
          user(login: $username) {
            id
            login
            name
            repositories {
              totalCount
            }
            followers {
              totalCount
            }
            following {
              totalCount
            }
            gists {
              totalCount
            }
            contributionsCollection {
              totalCommitContributions
              totalIssueContributions
              totalPullRequestContributions
              totalRepositoryContributions
            }
          }
        }
        """

        variables = {"username": username}
        return await self.query(query, variables)

    # ==================== Repository Queries ====================

    async def fetch_repository_details(
        self,
        owner: str,
        name: str
    ) -> Dict[str, Any]:
        """
        Fetch detailed repository information
        """
        query = """
        query($owner: String!, $name: String!) {
          repository(owner: $owner, name: $name) {
            id
            name
            nameWithOwner
            description
            isPrivate
            isFork
            isArchived
            stargazerCount
            forkCount
            watchers {
              totalCount
            }
            issues {
              totalCount
            }
            pullRequests {
              totalCount
            }
            primaryLanguage {
              name
              color
            }
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              totalSize
              edges {
                size
                node {
                  name
                  color
                }
              }
            }
            repositoryTopics(first: 20) {
              nodes {
                topic {
                  name
                }
              }
            }
            licenseInfo {
              name
              key
            }
            owner {
              login
              avatarUrl
            }
            url
            homepageUrl
            createdAt
            updatedAt
            pushedAt
            readme: object(expression: "HEAD:README.md") {
              ... on Blob {
                text
              }
            }
          }
        }
        """

        variables = {"owner": owner, "name": name}
        return await self.query(query, variables)

    async def fetch_repository_with_contributors(
        self,
        owner: str,
        name: str,
        first: int = 10
    ) -> Dict[str, Any]:
        """
        Fetch repository with top contributors
        """
        query = """
        query($owner: String!, $name: String!, $first: Int!) {
          repository(owner: $owner, name: $name) {
            id
            name
            nameWithOwner
            stargazerCount
            forkCount
            mentionableUsers(first: $first) {
              nodes {
                login
                name
                avatarUrl
                contributions: contributionsCollection {
                  totalCommitContributions
                }
              }
            }
            defaultBranchRef {
              target {
                ... on Commit {
                  history(first: 100) {
                    nodes {
                      author {
                        user {
                          login
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        """

        variables = {"owner": owner, "name": name, "first": first}
        return await self.query(query, variables)

    # ==================== Trending Queries ====================

    async def fetch_trending_repositories(
        self,
        first: int = 30,
        after: Optional[str] = None,
        language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch trending repositories using GraphQL search
        """
        # Build query string for trending repos (created in last week, sorted by stars)
        from datetime import datetime, timedelta

        week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")

        search_query = f"created:>{week_ago} stars:>100"
        if language:
            search_query += f" language:{language}"

        query = """
        query($query: String!, $first: Int!, $after: String) {
          search(query: $query, type: REPOSITORY, first: $first, after: $after) {
            repositoryCount
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                ... on Repository {
                  id
                  name
                  nameWithOwner
                  description
                  stargazerCount
                  forkCount
                  primaryLanguage {
                    name
                    color
                  }
                  repositoryTopics(first: 5) {
                    nodes {
                      topic {
                        name
                      }
                    }
                  }
                  owner {
                    login
                    avatarUrl
                  }
                  url
                  createdAt
                  updatedAt
                  pushedAt
                }
              }
            }
          }
        }
        """

        variables = {
            "query": search_query,
            "first": first,
            "after": after
        }

        return await self.query(query, variables)

    # ==================== Topic Queries ====================

    async def fetch_repositories_by_topic(
        self,
        topic: str,
        first: int = 30,
        after: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fetch repositories by topic
        """
        query = """
        query($query: String!, $first: Int!, $after: String) {
          search(query: $query, type: REPOSITORY, first: $first, after: $after) {
            repositoryCount
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                ... on Repository {
                  id
                  name
                  nameWithOwner
                  description
                  stargazerCount
                  forkCount
                  watchers {
                    totalCount
                  }
                  primaryLanguage {
                    name
                    color
                  }
                  repositoryTopics(first: 10) {
                    nodes {
                      topic {
                        name
                      }
                    }
                  }
                  owner {
                    login
                    avatarUrl
                  }
                  url
                  createdAt
                  updatedAt
                  pushedAt
                }
              }
            }
          }
        }
        """

        variables = {
            "query": f"topic:{topic}",
            "first": first,
            "after": after
        }

        return await self.query(query, variables)

    async def fetch_topic_info(self, topic_name: str) -> Dict[str, Any]:
        """
        Fetch information about a specific topic
        """
        query = """
        query($name: String!) {
          topic(name: $name) {
            name
            stargazerCount
            relatedTopics(first: 10) {
              name
            }
          }
        }
        """

        variables = {"name": topic_name}
        return await self.query(query, variables)

    # ==================== Search Queries ====================

    async def search_repositories(
        self,
        query_string: str,
        first: int = 30,
        after: Optional[str] = None,
        sort_by: str = "STARS"
    ) -> Dict[str, Any]:
        """
        Search repositories with GraphQL
        """
        query = """
        query($query: String!, $first: Int!, $after: String) {
          search(query: $query, type: REPOSITORY, first: $first, after: $after) {
            repositoryCount
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                ... on Repository {
                  id
                  name
                  nameWithOwner
                  description
                  stargazerCount
                  forkCount
                  watchers {
                    totalCount
                  }
                  primaryLanguage {
                    name
                    color
                  }
                  repositoryTopics(first: 10) {
                    nodes {
                      topic {
                        name
                      }
                    }
                  }
                  owner {
                    login
                    avatarUrl
                  }
                  url
                  createdAt
                  updatedAt
                  pushedAt
                }
              }
            }
          }
        }
        """

        # Add sort to query string
        full_query = f"{query_string} sort:{sort_by.lower()}"

        variables = {
            "query": full_query,
            "first": first,
            "after": after
        }

        return await self.query(query, variables)

    # ==================== Batch Operations ====================

    async def fetch_multiple_repositories(
        self,
        repos: List[Dict[str, str]]
    ) -> List[Dict[str, Any]]:
        """
        Fetch multiple repositories in a single query
        repos: [{"owner": "...", "name": "..."}, ...]
        """
        # Build aliases for each repo
        query_parts = []
        for i, repo in enumerate(repos[:10]):  # Limit to 10 repos per query
            alias = f"repo{i}"
            query_parts.append(f"""
            {alias}: repository(owner: "{repo['owner']}", name: "{repo['name']}") {{
              id
              name
              nameWithOwner
              description
              stargazerCount
              forkCount
              primaryLanguage {{
                name
              }}
              url
              createdAt
              updatedAt
            }}
            """)

        query = "query {" + "\n".join(query_parts) + "}"

        result = await self.query(query)

        # Extract repositories from aliased results
        repositories = []
        for i in range(len(repos)):
            alias = f"repo{i}"
            if alias in result and result[alias]:
                repositories.append(result[alias])

        return repositories

    # ==================== Rate Limit Query ====================

    async def fetch_rate_limit(self, token: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch current rate limit status
        """
        query = """
        query {
          rateLimit {
            limit
            remaining
            resetAt
            used
            cost
          }
        }
        """

        return await self.query(query, token=token)


# Singleton instance
_graphql_client: Optional[GitHubGraphQLClient] = None


def get_github_graphql_client() -> GitHubGraphQLClient:
    """Get or create GitHubGraphQLClient singleton"""
    global _graphql_client
    if _graphql_client is None:
        _graphql_client = GitHubGraphQLClient()
    return _graphql_client
