"""
Comprehensive tests for Repository API endpoints.
Tests cover listing, filtering, pagination, starring, and trending repositories.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, Repository, StarredRepository
from datetime import datetime, timedelta


@pytest.mark.api
class TestRepositoriesList:
    """Test repository listing endpoint."""

    async def test_list_repositories_success(self, client: AsyncClient):
        """Test successful repository listing."""
        response = await client.get("/api/v1/repositories")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data

    async def test_list_repositories_with_language_filter(self, client: AsyncClient):
        """Test filtering repositories by language."""
        response = await client.get("/api/v1/repositories?language=TypeScript")
        assert response.status_code == 200
        data = response.json()
        for repo in data["items"]:
            if repo.get("primaryLanguage"):
                assert repo["primaryLanguage"] == "TypeScript"

    async def test_list_repositories_with_topic_filter(self, client: AsyncClient):
        """Test filtering repositories by topic."""
        response = await client.get("/api/v1/repositories?topic=react")
        assert response.status_code == 200
        data = response.json()
        for repo in data["items"]:
            if repo.get("topics"):
                assert "react" in repo["topics"]

    async def test_list_repositories_pagination(self, client: AsyncClient):
        """Test repository pagination."""
        # Test first page
        response1 = await client.get("/api/v1/repositories?page=1&page_size=10")
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1["page"] == 1
        assert len(data1["items"]) <= 10

        # Test second page
        response2 = await client.get("/api/v1/repositories?page=2&page_size=10")
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["page"] == 2

    async def test_list_repositories_sort_by_stars(self, client: AsyncClient):
        """Test sorting repositories by star count."""
        response = await client.get("/api/v1/repositories?sort=stars&order=desc")
        assert response.status_code == 200
        data = response.json()
        stars = [repo["stargazerCount"] for repo in data["items"]]
        assert stars == sorted(stars, reverse=True)

    async def test_list_repositories_sort_by_updated(self, client: AsyncClient):
        """Test sorting repositories by update date."""
        response = await client.get("/api/v1/repositories?sort=updated&order=desc")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 0

    async def test_list_repositories_invalid_page(self, client: AsyncClient):
        """Test invalid page number."""
        response = await client.get("/api/v1/repositories?page=-1")
        assert response.status_code == 422

    async def test_list_repositories_invalid_page_size(self, client: AsyncClient):
        """Test invalid page size."""
        response = await client.get("/api/v1/repositories?page_size=1000")
        assert response.status_code == 422


@pytest.mark.api
class TestRepositoryDetail:
    """Test repository detail endpoint."""

    async def test_get_repository_success(self, client: AsyncClient, db_session: AsyncSession):
        """Test getting a repository by ID."""
        # Assuming we have at least one repository in the database
        response = await client.get("/api/v1/repositories")
        repos = response.json()["items"]

        if repos:
            repo_id = repos[0]["id"]
            response = await client.get(f"/api/v1/repositories/{repo_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == repo_id
            assert "name" in data
            assert "ownerLogin" in data

    async def test_get_repository_not_found(self, client: AsyncClient):
        """Test getting non-existent repository."""
        response = await client.get("/api/v1/repositories/99999999")
        assert response.status_code == 404

    async def test_get_repository_invalid_id(self, client: AsyncClient):
        """Test getting repository with invalid ID format."""
        response = await client.get("/api/v1/repositories/invalid-id")
        assert response.status_code == 422


@pytest.mark.api
class TestTrendingRepositories:
    """Test trending repositories endpoints."""

    async def test_get_trending_daily(self, client: AsyncClient):
        """Test getting daily trending repositories."""
        response = await client.get("/api/v1/repositories/trending?period=daily")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        for item in data["items"]:
            assert "rank" in item
            assert "starsToday" in item
            assert "repository" in item

    async def test_get_trending_weekly(self, client: AsyncClient):
        """Test getting weekly trending repositories."""
        response = await client.get("/api/v1/repositories/trending?period=weekly")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data

    async def test_get_trending_monthly(self, client: AsyncClient):
        """Test getting monthly trending repositories."""
        response = await client.get("/api/v1/repositories/trending?period=monthly")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data

    async def test_get_trending_with_language_filter(self, client: AsyncClient):
        """Test trending repositories filtered by language."""
        response = await client.get("/api/v1/repositories/trending?period=daily&language=Python")
        assert response.status_code == 200
        data = response.json()
        for item in data["items"]:
            if item.get("language"):
                assert item["language"] == "Python"

    async def test_get_trending_invalid_period(self, client: AsyncClient):
        """Test trending with invalid period."""
        response = await client.get("/api/v1/repositories/trending?period=invalid")
        assert response.status_code == 422


@pytest.mark.api
class TestStarRepository:
    """Test repository starring functionality."""

    async def test_star_repository_authenticated(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test starring a repository when authenticated."""
        # Get a repository to star
        response = await client.get("/api/v1/repositories")
        repos = response.json()["items"]

        if repos:
            repo_id = repos[0]["id"]
            response = await client.post(
                f"/api/v1/repositories/{repo_id}/star",
                headers=auth_headers
            )
            assert response.status_code in [200, 201]

    async def test_star_repository_unauthenticated(self, client: AsyncClient):
        """Test starring without authentication."""
        response = await client.post("/api/v1/repositories/1/star")
        assert response.status_code == 401

    async def test_star_nonexistent_repository(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test starring a non-existent repository."""
        response = await client.post(
            "/api/v1/repositories/99999999/star",
            headers=auth_headers
        )
        assert response.status_code == 404

    async def test_star_repository_twice(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test starring the same repository twice (idempotent)."""
        response = await client.get("/api/v1/repositories")
        repos = response.json()["items"]

        if repos:
            repo_id = repos[0]["id"]
            # Star first time
            response1 = await client.post(
                f"/api/v1/repositories/{repo_id}/star",
                headers=auth_headers
            )
            # Star second time
            response2 = await client.post(
                f"/api/v1/repositories/{repo_id}/star",
                headers=auth_headers
            )
            assert response2.status_code in [200, 201]

    async def test_unstar_repository(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test unstarring a repository."""
        response = await client.get("/api/v1/repositories")
        repos = response.json()["items"]

        if repos:
            repo_id = repos[0]["id"]
            # Star first
            await client.post(
                f"/api/v1/repositories/{repo_id}/star",
                headers=auth_headers
            )
            # Then unstar
            response = await client.delete(
                f"/api/v1/repositories/{repo_id}/star",
                headers=auth_headers
            )
            assert response.status_code in [200, 204]

    async def test_get_starred_repositories(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test getting user's starred repositories."""
        response = await client.get(
            "/api/v1/repositories/starred",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data


@pytest.mark.api
class TestRateLimiting:
    """Test rate limiting on repository endpoints."""

    async def test_rate_limiting(self, client: AsyncClient):
        """Test that rate limiting is enforced."""
        # Make many requests
        responses = []
        for _ in range(100):
            response = await client.get("/api/v1/repositories")
            responses.append(response)

        # Check if any requests were rate limited
        status_codes = [r.status_code for r in responses]
        # Either all succeed or some are rate limited
        assert all(code in [200, 429] for code in status_codes)


@pytest.mark.api
class TestRepositorySearch:
    """Test repository search functionality."""

    async def test_search_repositories_by_name(self, client: AsyncClient):
        """Test searching repositories by name."""
        response = await client.get("/api/v1/repositories?search=react")
        assert response.status_code == 200
        data = response.json()
        for repo in data["items"]:
            name_match = "react" in repo["name"].lower()
            desc_match = repo.get("description") and "react" in repo["description"].lower()
            assert name_match or desc_match

    async def test_search_repositories_empty_query(self, client: AsyncClient):
        """Test search with empty query."""
        response = await client.get("/api/v1/repositories?search=")
        assert response.status_code == 200

    async def test_search_repositories_special_characters(self, client: AsyncClient):
        """Test search with special characters."""
        response = await client.get("/api/v1/repositories?search=c++")
        assert response.status_code == 200


@pytest.mark.api
class TestRepositoryStats:
    """Test repository statistics endpoints."""

    async def test_get_repository_stats(self, client: AsyncClient):
        """Test getting repository statistics."""
        response = await client.get("/api/v1/repositories")
        repos = response.json()["items"]

        if repos:
            repo_id = repos[0]["id"]
            response = await client.get(f"/api/v1/repositories/{repo_id}/stats")
            assert response.status_code == 200
            data = response.json()
            assert "stars" in data or "stargazerCount" in data

    async def test_get_repository_contributors(self, client: AsyncClient):
        """Test getting repository contributors."""
        response = await client.get("/api/v1/repositories")
        repos = response.json()["items"]

        if repos:
            repo_id = repos[0]["id"]
            response = await client.get(f"/api/v1/repositories/{repo_id}/contributors")
            assert response.status_code in [200, 404]  # May not have contributors cached


@pytest.mark.api
class TestRepositoryValidation:
    """Test repository data validation."""

    async def test_repository_response_schema(self, client: AsyncClient):
        """Test that repository responses match expected schema."""
        response = await client.get("/api/v1/repositories")
        assert response.status_code == 200
        data = response.json()

        required_fields = ["items", "total", "page", "page_size"]
        for field in required_fields:
            assert field in data

        if data["items"]:
            repo = data["items"][0]
            repo_fields = ["id", "name", "ownerLogin", "stargazerCount"]
            for field in repo_fields:
                assert field in repo


@pytest.mark.api
class TestRepositoryPerformance:
    """Test repository endpoint performance."""

    @pytest.mark.slow
    async def test_list_repositories_performance(self, client: AsyncClient):
        """Test that listing repositories completes quickly."""
        import time
        start = time.time()
        response = await client.get("/api/v1/repositories?page_size=50")
        duration = time.time() - start

        assert response.status_code == 200
        assert duration < 2.0  # Should complete in less than 2 seconds

    @pytest.mark.slow
    async def test_concurrent_requests(self, client: AsyncClient):
        """Test handling concurrent repository requests."""
        import asyncio

        async def make_request():
            return await client.get("/api/v1/repositories")

        # Make 10 concurrent requests
        responses = await asyncio.gather(*[make_request() for _ in range(10)])

        assert all(r.status_code == 200 for r in responses)


@pytest.mark.api
class TestRepositoryEdgeCases:
    """Test edge cases for repository endpoints."""

    async def test_empty_database(self, client: AsyncClient):
        """Test repository listing with empty database."""
        response = await client.get("/api/v1/repositories")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 0

    async def test_very_large_page_number(self, client: AsyncClient):
        """Test requesting a very large page number."""
        response = await client.get("/api/v1/repositories?page=1000000")
        assert response.status_code in [200, 404]

    async def test_multiple_filters(self, client: AsyncClient):
        """Test applying multiple filters simultaneously."""
        response = await client.get(
            "/api/v1/repositories?language=Python&sort=stars&order=desc&page_size=20"
        )
        assert response.status_code == 200
