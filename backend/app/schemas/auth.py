"""
Authentication Pydantic schemas
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    """
    Schema for OAuth login request
    """

    code: str = Field(..., min_length=1, description="OAuth authorization code from GitHub")

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        """Validate OAuth code"""
        if not v or not v.strip():
            raise ValueError("Authorization code cannot be empty")
        return v.strip()


class TokenData(BaseModel):
    """
    Schema for JWT token payload data
    """

    user_id: str = Field(..., description="User ID")
    exp: int = Field(..., description="Token expiration timestamp")
    type: str = Field(..., description="Token type (access or refresh)")

    @field_validator("type")
    @classmethod
    def validate_token_type(cls, v: str) -> str:
        """Validate token type"""
        if v not in ["access", "refresh"]:
            raise ValueError("Token type must be either 'access' or 'refresh'")
        return v


class LoginResponse(BaseModel):
    """
    Schema for login response
    """

    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration time in seconds")
    user: UserResponse = Field(..., description="Authenticated user information")

    class Config:
        from_attributes = True


class RefreshRequest(BaseModel):
    """
    Schema for token refresh request
    """

    refresh_token: str = Field(..., min_length=1, description="JWT refresh token")

    @field_validator("refresh_token")
    @classmethod
    def validate_refresh_token(cls, v: str) -> str:
        """Validate refresh token"""
        if not v or not v.strip():
            raise ValueError("Refresh token cannot be empty")
        return v.strip()


class RefreshResponse(BaseModel):
    """
    Schema for token refresh response
    """

    access_token: str = Field(..., description="New JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration time in seconds")

    class Config:
        from_attributes = True


class LogoutResponse(BaseModel):
    """
    Schema for logout response
    """

    message: str = Field(default="Successfully logged out", description="Logout message")
    success: bool = Field(default=True, description="Logout success status")


class GitHubUserData(BaseModel):
    """
    Schema for GitHub user data from API
    """

    id: int = Field(..., description="GitHub user ID")
    login: str = Field(..., description="GitHub login username")
    name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    blog: Optional[str] = None
    twitter_username: Optional[str] = None
    public_repos: int = Field(default=0)
    public_gists: int = Field(default=0)
    followers: int = Field(default=0)
    following: int = Field(default=0)


class SessionData(BaseModel):
    """
    Schema for session data stored in Redis
    """

    user_id: str = Field(..., description="User ID")
    access_token: str = Field(..., description="Access token")
    refresh_token: str = Field(..., description="Refresh token")
    ip_address: Optional[str] = Field(None, description="User's IP address")
    user_agent: Optional[str] = Field(None, description="User's browser/device info")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(..., description="Session expiration time")

    class Config:
        from_attributes = True
