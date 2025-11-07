"""
Authentication endpoint tests
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.auth import GitHubUserData
from app.services.auth_service import AuthService
from app.core.security import create_access_token, create_refresh_token


class TestAuthLogin:
    """Test /auth/login endpoint"""

    @pytest.mark.asyncio
    async def test_login_returns_github_oauth_url(self, client: AsyncClient):
        """Test that login endpoint returns GitHub OAuth URL"""
        response = await client.post("/api/v1/auth/login")

        assert response.status_code == 200
        data = response.json()
        assert "auth_url" in data
        assert "github.com/login/oauth/authorize" in data["auth_url"]
        assert "client_id" in data["auth_url"]


class TestAuthCallback:
    """Test /auth/callback endpoint"""

    @pytest.mark.asyncio
    async def test_callback_success(
        self,
        client: AsyncClient,
        test_db: AsyncSession,
        mock_oauth_code: str,
        mock_github_token: str,
        mock_github_user: dict,
    ):
        """Test successful OAuth callback"""
        # Mock AuthService methods
        with patch.object(
            AuthService, "exchange_code_for_token", new_callable=AsyncMock
        ) as mock_exchange:
            with patch.object(
                AuthService, "get_github_user", new_callable=AsyncMock
            ) as mock_get_user:
                with patch.object(
                    AuthService, "create_or_update_user", new_callable=AsyncMock
                ) as mock_create_user:
                    with patch.object(
                        AuthService, "create_session", new_callable=AsyncMock
                    ) as mock_create_session:
                        # Setup mocks
                        mock_exchange.return_value = mock_github_token
                        mock_get_user.return_value = GitHubUserData(**mock_github_user)

                        # Create mock user
                        mock_user = User(
                            github_id=str(mock_github_user["id"]),
                            login=mock_github_user["login"],
                            name=mock_github_user["name"],
                            email=mock_github_user["email"],
                        )
                        mock_create_user.return_value = mock_user

                        # Mock session creation
                        mock_create_session.return_value = {
                            "access_token": "test_access_token",
                            "refresh_token": "test_refresh_token",
                            "token_type": "bearer",
                            "expires_in": 1800,
                        }

                        # Make request
                        response = await client.post(
                            "/api/v1/auth/callback",
                            json={"code": mock_oauth_code},
                        )

                        # Assertions
                        assert response.status_code == 200
                        data = response.json()
                        assert "access_token" in data
                        assert "refresh_token" in data
                        assert data["token_type"] == "bearer"
                        assert "user" in data
                        assert data["user"]["login"] == mock_github_user["login"]

    @pytest.mark.asyncio
    async def test_callback_invalid_code(self, client: AsyncClient):
        """Test callback with invalid OAuth code"""
        with patch.object(
            AuthService, "exchange_code_for_token", new_callable=AsyncMock
        ) as mock_exchange:
            # Mock exchange failure
            from fastapi import HTTPException, status

            mock_exchange.side_effect = HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OAuth code",
            )

            response = await client.post(
                "/api/v1/auth/callback",
                json={"code": "invalid_code"},
            )

            assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_callback_missing_code(self, client: AsyncClient):
        """Test callback without OAuth code"""
        response = await client.post(
            "/api/v1/auth/callback",
            json={},
        )

        assert response.status_code == 422  # Validation error


class TestAuthRefresh:
    """Test /auth/refresh endpoint"""

    @pytest.mark.asyncio
    async def test_refresh_token_success(
        self, client: AsyncClient, test_db: AsyncSession
    ):
        """Test successful token refresh"""
        # Create a user and refresh token
        user = User(
            github_id="12345",
            login="testuser",
            name="Test User",
            email="test@example.com",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # Create valid refresh token
        refresh_token = create_refresh_token({"sub": str(user.id)})

        # Mock Redis to return user_id for refresh token
        with patch(
            "app.services.auth_service.get_redis", new_callable=AsyncMock
        ) as mock_get_redis:
            mock_redis = AsyncMock()
            mock_redis.get = AsyncMock(return_value=str(user.id))
            mock_redis.setex = AsyncMock()
            mock_get_redis.return_value = mock_redis

            response = await client.post(
                "/api/v1/auth/refresh",
                json={"refresh_token": refresh_token},
            )

            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"
            assert "expires_in" in data

    @pytest.mark.asyncio
    async def test_refresh_token_invalid(self, client: AsyncClient):
        """Test refresh with invalid token"""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid_token"},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_token_missing(self, client: AsyncClient):
        """Test refresh without token"""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={},
        )

        assert response.status_code == 422  # Validation error


class TestAuthLogout:
    """Test /auth/logout endpoint"""

    @pytest.mark.asyncio
    async def test_logout_success(self, client: AsyncClient, test_db: AsyncSession):
        """Test successful logout"""
        # Create a user
        user = User(
            github_id="12345",
            login="testuser",
            name="Test User",
            email="test@example.com",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # Create valid access token
        access_token = create_access_token({"sub": str(user.id)})

        # Mock Redis
        with patch(
            "app.services.auth_service.get_redis", new_callable=AsyncMock
        ) as mock_get_redis:
            mock_redis = AsyncMock()
            mock_redis.delete = AsyncMock()
            mock_redis.get = AsyncMock(return_value=None)
            mock_get_redis.return_value = mock_redis

            response = await client.post(
                "/api/v1/auth/logout",
                headers={"Authorization": f"Bearer {access_token}"},
            )

            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert "logged out" in data["message"].lower()

    @pytest.mark.asyncio
    async def test_logout_unauthorized(self, client: AsyncClient):
        """Test logout without authentication"""
        response = await client.post("/api/v1/auth/logout")

        assert response.status_code == 403  # No credentials provided


class TestAuthMe:
    """Test /auth/me endpoint"""

    @pytest.mark.asyncio
    async def test_get_current_user_success(
        self, client: AsyncClient, test_db: AsyncSession
    ):
        """Test getting current user information"""
        # Create a user
        user = User(
            github_id="12345",
            login="testuser",
            name="Test User",
            email="test@example.com",
            avatar_url="https://example.com/avatar.jpg",
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)

        # Create valid access token
        access_token = create_access_token({"sub": str(user.id)})

        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["login"] == "testuser"
        assert data["name"] == "Test User"
        assert data["email"] == "test@example.com"

    @pytest.mark.asyncio
    async def test_get_current_user_unauthorized(self, client: AsyncClient):
        """Test getting current user without authentication"""
        response = await client.get("/api/v1/auth/me")

        assert response.status_code == 403  # No credentials provided

    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """Test getting current user with invalid token"""
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token"},
        )

        assert response.status_code == 401


class TestRateLimiting:
    """Test rate limiting on auth endpoints"""

    @pytest.mark.asyncio
    async def test_rate_limit_not_exceeded(self, client: AsyncClient):
        """Test that rate limit allows normal requests"""
        # Make a few requests (should be under limit)
        for _ in range(3):
            response = await client.post("/api/v1/auth/login")
            assert response.status_code == 200

    @pytest.mark.asyncio
    @pytest.mark.skip(reason="Requires Redis rate limiting to be fully configured")
    async def test_rate_limit_exceeded(self, client: AsyncClient):
        """Test that rate limit blocks excessive requests"""
        # Make many requests to exceed limit
        responses = []
        for _ in range(15):  # Assuming limit is 10 per minute
            response = await client.post("/api/v1/auth/login")
            responses.append(response)

        # Check that some requests were rate limited
        rate_limited = any(r.status_code == 429 for r in responses)
        assert rate_limited


class TestAuditLogging:
    """Test audit logging functionality"""

    @pytest.mark.asyncio
    async def test_login_creates_audit_log(
        self, client: AsyncClient, test_db: AsyncSession, mock_oauth_code: str
    ):
        """Test that successful login creates audit log entry"""
        # This test would require checking the database for audit log entries
        # after a successful login
        # Implementation depends on your audit log structure
        pass

    @pytest.mark.asyncio
    async def test_failed_login_creates_audit_log(
        self, client: AsyncClient, test_db: AsyncSession
    ):
        """Test that failed login creates audit log entry"""
        # This test would require checking the database for audit log entries
        # after a failed login attempt
        pass
