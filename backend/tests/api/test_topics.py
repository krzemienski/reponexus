"""
Comprehensive tests for Topics API endpoints.
Tests cover listing, following, and topic-based repository discovery.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.mark.api
class TestTopicsList:
    """Test topic listing endpoints."""

    async def test_list_topics_success(self, client: AsyncClient):
        """Test successful topic listing."""
        response = await client.get("/api/v1/topics")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)

    async def test_list_topics_pagination(self, client: AsyncClient):
        """Test topic pagination."""
        response = await client.get("/api/v1/topics?page=1&page_size=20")
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert len(data["items"]) <= 20

    async def test_list_topics_sort_by_repositories(self, client: AsyncClient):
        """Test sorting topics by repository count."""
        response = await client.get("/api/v1/topics?sort=repositories")
        assert response.status_code == 200
        data = response.json()
        if len(data["items"]) > 1:
            counts = [topic.get("repositoryCount", 0) for topic in data["items"]]
            assert counts == sorted(counts, reverse=True)

    async def test_list_trending_topics(self, client: AsyncClient):
        """Test getting trending topics."""
        response = await client.get("/api/v1/topics/trending")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data


@pytest.mark.api
class TestTopicDetail:
    """Test topic detail endpoints."""

    async def test_get_topic_success(self, client: AsyncClient):
        """Test getting a specific topic."""
        # First get list of topics
        response = await client.get("/api/v1/topics")
        topics = response.json()["items"]

        if topics:
            topic_name = topics[0]["name"]
            response = await client.get(f"/api/v1/topics/{topic_name}")
            assert response.status_code == 200
            data = response.json()
            assert data["name"] == topic_name

    async def test_get_topic_not_found(self, client: AsyncClient):
        """Test getting non-existent topic."""
        response = await client.get("/api/v1/topics/nonexistent-topic-xyz-123")
        assert response.status_code == 404

    async def test_get_topic_repositories(self, client: AsyncClient):
        """Test getting repositories for a topic."""
        response = await client.get("/api/v1/topics")
        topics = response.json()["items"]

        if topics:
            topic_name = topics[0]["name"]
            response = await client.get(f"/api/v1/topics/{topic_name}/repositories")
            assert response.status_code == 200
            data = response.json()
            assert "items" in data


@pytest.mark.api
class TestFollowTopics:
    """Test topic following functionality."""

    async def test_follow_topic_authenticated(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test following a topic when authenticated."""
        response = await client.get("/api/v1/topics")
        topics = response.json()["items"]

        if topics:
            topic_name = topics[0]["name"]
            response = await client.post(
                f"/api/v1/topics/{topic_name}/follow",
                headers=auth_headers
            )
            assert response.status_code in [200, 201]

    async def test_follow_topic_unauthenticated(self, client: AsyncClient):
        """Test following a topic without authentication."""
        response = await client.post("/api/v1/topics/react/follow")
        assert response.status_code == 401

    async def test_unfollow_topic(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test unfollowing a topic."""
        response = await client.get("/api/v1/topics")
        topics = response.json()["items"]

        if topics:
            topic_name = topics[0]["name"]
            # Follow first
            await client.post(
                f"/api/v1/topics/{topic_name}/follow",
                headers=auth_headers
            )
            # Then unfollow
            response = await client.delete(
                f"/api/v1/topics/{topic_name}/follow",
                headers=auth_headers
            )
            assert response.status_code in [200, 204]

    async def test_get_followed_topics(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test getting user's followed topics."""
        response = await client.get(
            "/api/v1/topics/followed",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data

    async def test_follow_topic_idempotent(
        self, client: AsyncClient, auth_headers: dict
    ):
        """Test that following the same topic twice is idempotent."""
        response = await client.get("/api/v1/topics")
        topics = response.json()["items"]

        if topics:
            topic_name = topics[0]["name"]
            # Follow twice
            response1 = await client.post(
                f"/api/v1/topics/{topic_name}/follow",
                headers=auth_headers
            )
            response2 = await client.post(
                f"/api/v1/topics/{topic_name}/follow",
                headers=auth_headers
            )
            assert response2.status_code in [200, 201]


@pytest.mark.api
class TestTopicSearch:
    """Test topic search functionality."""

    async def test_search_topics(self, client: AsyncClient):
        """Test searching for topics."""
        response = await client.get("/api/v1/topics?search=javascript")
        assert response.status_code == 200
        data = response.json()
        for topic in data["items"]:
            assert "javascript" in topic["name"].lower() or \
                   (topic.get("description") and "javascript" in topic["description"].lower())

    async def test_search_topics_empty_query(self, client: AsyncClient):
        """Test search with empty query."""
        response = await client.get("/api/v1/topics?search=")
        assert response.status_code == 200


@pytest.mark.api
class TestTopicValidation:
    """Test topic data validation."""

    async def test_topic_response_schema(self, client: AsyncClient):
        """Test that topic responses match expected schema."""
        response = await client.get("/api/v1/topics")
        assert response.status_code == 200
        data = response.json()

        assert "items" in data
        if data["items"]:
            topic = data["items"][0]
            assert "name" in topic

    async def test_invalid_topic_name_format(self, client: AsyncClient):
        """Test following topic with invalid name format."""
        response = await client.get("/api/v1/topics/invalid name with spaces")
        # Should either normalize or reject
        assert response.status_code in [200, 404, 422]


@pytest.mark.api
class TestTopicEdgeCases:
    """Test edge cases for topic endpoints."""

    async def test_topic_with_special_characters(self, client: AsyncClient):
        """Test topics with special characters in name."""
        response = await client.get("/api/v1/topics/c++")
        # Should handle URL encoding
        assert response.status_code in [200, 404]

    async def test_very_long_topic_name(self, client: AsyncClient):
        """Test topic with very long name."""
        long_name = "a" * 200
        response = await client.get(f"/api/v1/topics/{long_name}")
        assert response.status_code in [404, 422]

    async def test_topic_case_sensitivity(self, client: AsyncClient):
        """Test that topic names are case-insensitive."""
        response1 = await client.get("/api/v1/topics/React")
        response2 = await client.get("/api/v1/topics/react")
        # Both should work or both should fail consistently
        assert response1.status_code == response2.status_code
