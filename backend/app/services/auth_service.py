"""
Authentication Service for GitHub OAuth and user management
"""

import httpx
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.cache import get_redis, cache_set, cache_get, cache_delete
from app.models.user import User
from app.schemas.auth import GitHubUserData, SessionData


class AuthService:
    """
    Service class for authentication operations
    """

    GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
    GITHUB_USER_URL = "https://api.github.com/user"
    GITHUB_USER_EMAILS_URL = "https://api.github.com/user/emails"

    def __init__(self, db: AsyncSession):
        self.db = db

    async def exchange_code_for_token(self, code: str) -> str:
        """
        Exchange OAuth authorization code for GitHub access token

        Args:
            code: OAuth authorization code from GitHub

        Returns:
            GitHub access token

        Raises:
            HTTPException: If token exchange fails
        """
        params = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": code,
        }

        headers = {"Accept": "application/json"}

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    self.GITHUB_TOKEN_URL,
                    params=params,
                    headers=headers,
                    timeout=30.0,
                )
                response.raise_for_status()

                data = response.json()

                if "error" in data:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"GitHub OAuth error: {data.get('error_description', data['error'])}",
                    )

                access_token = data.get("access_token")
                if not access_token:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No access token returned from GitHub",
                    )

                return access_token

            except httpx.HTTPError as e:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Failed to communicate with GitHub: {str(e)}",
                )

    async def get_github_user(self, access_token: str) -> GitHubUserData:
        """
        Fetch user profile data from GitHub API

        Args:
            access_token: GitHub access token

        Returns:
            GitHubUserData with user profile information

        Raises:
            HTTPException: If fetching user data fails
        """
        headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/vnd.github.v3+json",
        }

        async with httpx.AsyncClient() as client:
            try:
                # Fetch user profile
                response = await client.get(
                    self.GITHUB_USER_URL,
                    headers=headers,
                    timeout=30.0,
                )
                response.raise_for_status()
                user_data = response.json()

                # If email is not public, fetch from emails endpoint
                if not user_data.get("email"):
                    try:
                        emails_response = await client.get(
                            self.GITHUB_USER_EMAILS_URL,
                            headers=headers,
                            timeout=30.0,
                        )
                        if emails_response.status_code == 200:
                            emails = emails_response.json()
                            # Get primary email
                            primary_email = next(
                                (e["email"] for e in emails if e.get("primary")),
                                None,
                            )
                            if primary_email:
                                user_data["email"] = primary_email
                    except Exception:
                        # If we can't get email, continue without it
                        pass

                return GitHubUserData(**user_data)

            except httpx.HTTPError as e:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Failed to fetch user data from GitHub: {str(e)}",
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error processing GitHub user data: {str(e)}",
                )

    async def create_or_update_user(
        self, github_data: GitHubUserData, access_token: str
    ) -> User:
        """
        Create a new user or update existing user with GitHub data

        Args:
            github_data: User data from GitHub
            access_token: GitHub access token (will be encrypted)

        Returns:
            User model instance

        Raises:
            HTTPException: If database operations fail
        """
        try:
            # Check if user already exists by GitHub ID
            result = await self.db.execute(
                select(User).where(User.github_id == str(github_data.id))
            )
            user = result.scalar_one_or_none()

            now = datetime.utcnow()

            if user:
                # Update existing user
                user.login = github_data.login
                user.name = github_data.name
                user.email = github_data.email
                user.avatar_url = github_data.avatar_url
                user.bio = github_data.bio
                user.company = github_data.company
                user.location = github_data.location
                user.blog = github_data.blog
                user.twitter_username = github_data.twitter_username
                user.public_repos = github_data.public_repos
                user.public_gists = github_data.public_gists
                user.followers = github_data.followers
                user.following = github_data.following
                user.access_token = access_token  # TODO: Encrypt this
                user.updated_at = now
                user.last_login_at = now
            else:
                # Create new user
                user = User(
                    github_id=str(github_data.id),
                    login=github_data.login,
                    name=github_data.name,
                    email=github_data.email,
                    avatar_url=github_data.avatar_url,
                    bio=github_data.bio,
                    company=github_data.company,
                    location=github_data.location,
                    blog=github_data.blog,
                    twitter_username=github_data.twitter_username,
                    public_repos=github_data.public_repos,
                    public_gists=github_data.public_gists,
                    followers=github_data.followers,
                    following=github_data.following,
                    access_token=access_token,  # TODO: Encrypt this
                    last_login_at=now,
                )
                self.db.add(user)

            await self.db.commit()
            await self.db.refresh(user)

            return user

        except Exception as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create or update user: {str(e)}",
            )

    async def create_session(
        self,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Create a new session for the user

        Args:
            user: User model instance
            ip_address: User's IP address
            user_agent: User's browser/device information

        Returns:
            Dictionary with access_token, refresh_token, and expires_in
        """
        # Generate tokens
        token_data = {"sub": str(user.id)}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Calculate expiration
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        session_expires_at = datetime.utcnow() + timedelta(minutes=30)

        # Store session in Redis
        session_data = SessionData(
            user_id=str(user.id),
            access_token=access_token,
            refresh_token=refresh_token,
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.utcnow(),
            expires_at=session_expires_at,
        )

        redis_client = await get_redis()
        session_key = f"session:{user.id}"

        # Store session with 30 minute TTL
        await redis_client.setex(
            session_key,
            1800,  # 30 minutes
            session_data.model_dump_json(),
        )

        # Store refresh token separately
        refresh_token_key = f"refresh_token:{refresh_token}"
        await redis_client.setex(
            refresh_token_key,
            settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,  # Convert days to seconds
            str(user.id),
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": expires_in,
        }

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Validate refresh token and generate new access token

        Args:
            refresh_token: JWT refresh token

        Returns:
            Dictionary with new access_token and expires_in

        Raises:
            HTTPException: If refresh token is invalid or expired
        """
        # Decode and validate refresh token
        payload = decode_token(refresh_token)

        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        # Check if refresh token exists in Redis
        redis_client = await get_redis()
        refresh_token_key = f"refresh_token:{refresh_token}"
        user_id = await redis_client.get(refresh_token_key)

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token not found or expired",
            )

        # Verify user exists
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        # Generate new access token
        token_data = {"sub": str(user.id)}
        access_token = create_access_token(token_data)
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

        # Update session with new access token
        session_key = f"session:{user.id}"
        session_data_json = await redis_client.get(session_key)

        if session_data_json:
            session_data = SessionData.model_validate_json(session_data_json)
            session_data.access_token = access_token
            await redis_client.setex(
                session_key,
                1800,  # 30 minutes
                session_data.model_dump_json(),
            )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": expires_in,
        }

    async def revoke_token(self, user_id: str) -> None:
        """
        Remove tokens from database/cache (logout)

        Args:
            user_id: User's unique identifier
        """
        redis_client = await get_redis()

        # Delete session
        session_key = f"session:{user_id}"
        await redis_client.delete(session_key)

        # Get and delete refresh token
        session_data_json = await redis_client.get(session_key)
        if session_data_json:
            try:
                session_data = SessionData.model_validate_json(session_data_json)
                refresh_token_key = f"refresh_token:{session_data.refresh_token}"
                await redis_client.delete(refresh_token_key)
            except Exception:
                pass

        # Clear user's refresh token from database
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if user:
            user.refresh_token = None
            await self.db.commit()
