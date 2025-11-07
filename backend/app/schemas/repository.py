from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime
from uuid import UUID


class RepositoryBase(BaseModel):
    """Base repository schema with common fields"""
    name: str = Field(..., min_length=1, max_length=255)
    name_with_owner: str = Field(..., min_length=1, max_length=255)
    owner_login: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    primary_language: Optional[str] = None
    topics: List[str] = Field(default_factory=list)


class RepositoryCreate(RepositoryBase):
    """Schema for creating a repository"""
    github_id: str = Field(..., min_length=1)
    node_id: str = Field(..., min_length=1)
    html_url: str = Field(..., min_length=1)
    api_url: str = Field(..., min_length=1)
    clone_url: Optional[str] = None
    is_private: bool = False
    is_fork: bool = False
    is_archived: bool = False
    stargazer_count: int = Field(0, ge=0)
    watcher_count: int = Field(0, ge=0)
    fork_count: int = Field(0, ge=0)
    open_issues_count: int = Field(0, ge=0)
    languages: Dict[str, int] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime
    pushed_at: Optional[datetime] = None


class RepositoryUpdate(BaseModel):
    """Schema for updating a repository"""
    description: Optional[str] = None
    stargazer_count: Optional[int] = Field(None, ge=0)
    watcher_count: Optional[int] = Field(None, ge=0)
    fork_count: Optional[int] = Field(None, ge=0)
    open_issues_count: Optional[int] = Field(None, ge=0)
    primary_language: Optional[str] = None
    languages: Optional[Dict[str, int]] = None
    topics: Optional[List[str]] = None
    is_archived: Optional[bool] = None
    updated_at: Optional[datetime] = None
    pushed_at: Optional[datetime] = None
    trending_score: Optional[int] = None
    quality_score: Optional[int] = None


class RepositoryResponse(RepositoryBase):
    """Schema for repository response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    github_id: str
    node_id: str
    html_url: str
    api_url: str
    clone_url: Optional[str] = None
    is_private: bool
    is_fork: bool
    is_archived: bool
    stargazer_count: int
    watcher_count: int
    fork_count: int
    open_issues_count: int
    languages: Dict[str, int]
    created_at: datetime
    updated_at: datetime
    pushed_at: Optional[datetime] = None
    last_fetched_at: datetime
    trending_score: int
    quality_score: int
    is_starred: Optional[bool] = None  # Computed field for current user


class RepositoryDetailResponse(RepositoryResponse):
    """Detailed repository response with additional data"""
    star_count: Optional[int] = None
    contributor_count: Optional[int] = None
    readme_content: Optional[str] = None


class RepositoryListResponse(BaseModel):
    """Repository list item (lighter version)"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    name_with_owner: str
    owner_login: str
    description: Optional[str] = None
    primary_language: Optional[str] = None
    topics: List[str]
    stargazer_count: int
    fork_count: int
    is_fork: bool
    is_archived: bool
    html_url: str
    updated_at: datetime
    is_starred: Optional[bool] = None


class TrendingRepository(BaseModel):
    """Trending repository schema"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    name_with_owner: str
    owner_login: str
    description: Optional[str] = None
    primary_language: Optional[str] = None
    stargazer_count: int
    fork_count: int
    trending_score: int
    stars_today: Optional[int] = None
    stars_this_week: Optional[int] = None
    stars_this_month: Optional[int] = None
    html_url: str


class ReadmeResponse(BaseModel):
    """README content response"""
    content: str
    encoding: str = "markdown"
    size: int
    cached: bool = False
    last_updated: Optional[datetime] = None


class StarRepositoryResponse(BaseModel):
    """Response after starring a repository"""
    message: str = "Repository starred successfully"
    starred: bool = True
    starred_at: datetime
    repository: RepositoryListResponse


class UnstarRepositoryResponse(BaseModel):
    """Response after unstarring a repository"""
    message: str = "Repository unstarred successfully"
    starred: bool = False


class RepositoryStatsResponse(BaseModel):
    """Repository statistics"""
    total_repositories: int
    total_stars: int
    languages_distribution: Dict[str, int]
    topics_distribution: Dict[str, int]
    fork_percentage: float
    average_stars: float
