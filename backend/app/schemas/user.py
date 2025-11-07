"""
User Pydantic schemas
"""

from pydantic import BaseModel, Field, EmailStr, HttpUrl, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    """
    Base user schema with common fields
    """

    login: str = Field(..., min_length=1, max_length=100, description="GitHub login username")
    name: Optional[str] = Field(None, max_length=200, description="User's full name")
    email: Optional[EmailStr] = Field(None, description="User's email address")
    avatar_url: Optional[str] = Field(None, description="URL to user's avatar image")
    bio: Optional[str] = Field(None, max_length=500, description="User's biography")
    company: Optional[str] = Field(None, max_length=200, description="User's company")
    location: Optional[str] = Field(None, max_length=200, description="User's location")
    blog: Optional[str] = Field(None, max_length=500, description="User's blog URL")
    twitter_username: Optional[str] = Field(
        None, max_length=100, description="User's Twitter username"
    )

    @field_validator("login")
    @classmethod
    def validate_login(cls, v: str) -> str:
        """Validate login username"""
        if not v or not v.strip():
            raise ValueError("Login username cannot be empty")
        # GitHub usernames can only contain alphanumeric characters and hyphens
        # and cannot start or end with a hyphen
        if not all(c.isalnum() or c == "-" for c in v):
            raise ValueError("Login username can only contain alphanumeric characters and hyphens")
        if v.startswith("-") or v.endswith("-"):
            raise ValueError("Login username cannot start or end with a hyphen")
        return v.strip()


class UserCreate(UserBase):
    """
    Schema for creating a new user
    """

    github_id: str = Field(..., description="GitHub user ID")
    access_token: Optional[str] = Field(None, description="GitHub access token")
    public_repos: int = Field(default=0, ge=0, description="Number of public repositories")
    public_gists: int = Field(default=0, ge=0, description="Number of public gists")
    followers: int = Field(default=0, ge=0, description="Number of followers")
    following: int = Field(default=0, ge=0, description="Number of users following")

    @field_validator("github_id")
    @classmethod
    def validate_github_id(cls, v: str) -> str:
        """Validate GitHub ID"""
        if not v or not v.strip():
            raise ValueError("GitHub ID cannot be empty")
        return v.strip()


class UserUpdate(BaseModel):
    """
    Schema for updating user information
    """

    name: Optional[str] = Field(None, max_length=200)
    email: Optional[EmailStr] = None
    bio: Optional[str] = Field(None, max_length=500)
    company: Optional[str] = Field(None, max_length=200)
    location: Optional[str] = Field(None, max_length=200)
    blog: Optional[str] = Field(None, max_length=500)
    twitter_username: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = None
    public_repos: Optional[int] = Field(None, ge=0)
    public_gists: Optional[int] = Field(None, ge=0)
    followers: Optional[int] = Field(None, ge=0)
    following: Optional[int] = Field(None, ge=0)


class UserInDB(UserBase):
    """
    Schema for user as stored in database (includes all fields)
    """

    id: UUID = Field(..., description="User's unique identifier")
    github_id: str = Field(..., description="GitHub user ID")
    public_repos: int = Field(default=0, description="Number of public repositories")
    public_gists: int = Field(default=0, description="Number of public gists")
    followers: int = Field(default=0, description="Number of followers")
    following: int = Field(default=0, description="Number of users following")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    last_login_at: Optional[datetime] = Field(None, description="Last login timestamp")

    class Config:
        from_attributes = True


class UserResponse(UserInDB):
    """
    Schema for user responses (excludes sensitive information)
    """

    pass


class UserStats(BaseModel):
    """
    Schema for user statistics
    """

    public_repos: int = Field(default=0, description="Number of public repositories")
    public_gists: int = Field(default=0, description="Number of public gists")
    followers: int = Field(default=0, description="Number of followers")
    following: int = Field(default=0, description="Number of users following")

    class Config:
        from_attributes = True


class UserProfileResponse(UserResponse):
    """
    Extended user profile with additional data
    """
    starred_count: Optional[int] = Field(None, description="Number of starred repositories")
    followed_topics_count: Optional[int] = Field(None, description="Number of followed topics")


class UserListResponse(BaseModel):
    """
    Lighter user response for lists
    """
    id: UUID
    login: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    public_repos: int = 0
    followers: int = 0

    class Config:
        from_attributes = True
