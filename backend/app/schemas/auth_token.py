"""
Pydantic schemas for token-based authentication
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from app.schemas.user import UserResponse


class TokenLoginRequest(BaseModel):
    """
    Schema for token-based login request
    """

    github_token: str = Field(
        ...,
        min_length=1,
        description="GitHub personal access token",
        json_schema_extra={"example": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
    )

    @field_validator("github_token")
    @classmethod
    def validate_token(cls, v: str) -> str:
        """Validate GitHub token format"""
        if not v or not v.strip():
            raise ValueError("GitHub token cannot be empty")

        # Basic format validation for GitHub tokens
        v = v.strip()
        if not (v.startswith("ghp_") or v.startswith("gho_") or v.startswith("ghs_")):
            raise ValueError("Invalid GitHub token format")

        return v


class TokenLoginResponse(BaseModel):
    """
    Schema for token-based login response
    """

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration time in seconds")
    user: UserResponse = Field(..., description="Authenticated user information")

    class Config:
        from_attributes = True


class GitHubUserInfo(BaseModel):
    """
    Schema for GitHub user data from API
    """

    id: int = Field(..., description="GitHub user ID")
    login: str = Field(..., description="GitHub login username")
    name: Optional[str] = Field(None, description="User's full name")
    email: Optional[str] = Field(None, description="User's email address")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")
    bio: Optional[str] = Field(None, description="User biography")
    company: Optional[str] = Field(None, description="Company name")
    location: Optional[str] = Field(None, description="User location")
    blog: Optional[str] = Field(None, description="Blog/website URL")
    twitter_username: Optional[str] = Field(None, description="Twitter username")
    public_repos: int = Field(default=0, description="Number of public repositories")
    public_gists: int = Field(default=0, description="Number of public gists")
    followers: int = Field(default=0, description="Number of followers")
    following: int = Field(default=0, description="Number of users following")

    class Config:
        from_attributes = True
