"""
Trending Schemas - Pydantic models for trending API responses
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class TrendingScoreBase(BaseModel):
    """Base schema for trending score"""
    trending_score: float = Field(..., ge=0.0, le=100.0, description="Overall trending score (0-100)")
    star_growth_rate: float = Field(..., ge=0.0, le=100.0, description="Star growth component (0-100)")
    activity_score: float = Field(..., ge=0.0, le=100.0, description="Activity component (0-100)")
    community_score: float = Field(..., ge=0.0, le=100.0, description="Community engagement component (0-100)")
    recency_score: float = Field(..., ge=0.0, le=100.0, description="Recency component (0-100)")
    quality_score: float = Field(..., ge=0.0, le=100.0, description="Quality component (0-100)")
    time_window: str = Field(..., description="Time window: daily, weekly, or monthly")
    calculated_at: datetime = Field(..., description="When the score was calculated")

    model_config = ConfigDict(from_attributes=True)


class TrendingScoreResponse(TrendingScoreBase):
    """Full trending score response"""
    id: UUID
    repository_id: UUID
    topic_id: UUID


class TrendingRepositoryResponse(BaseModel):
    """Repository with trending score information"""
    # Repository fields
    id: UUID
    github_id: str
    name_with_owner: str
    name: str
    owner_login: str
    description: Optional[str] = None
    stargazer_count: int
    fork_count: int
    open_issues_count: int
    primary_language: Optional[str] = None
    topics: List[str] = []
    html_url: str
    created_at: datetime
    updated_at: datetime
    pushed_at: Optional[datetime] = None

    # Trending information
    trending_score: Optional[float] = Field(None, description="Trending score (0-100)")
    star_growth_rate: Optional[float] = None
    activity_score: Optional[float] = None
    community_score: Optional[float] = None
    recency_score: Optional[float] = None
    quality_score: Optional[float] = None
    trending_time_window: Optional[str] = None
    trending_calculated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TrendingListResponse(BaseModel):
    """Response for trending repositories list"""
    repositories: List[TrendingRepositoryResponse]
    time_window: str = Field(..., description="Time window used: daily, weekly, or monthly")
    topic_id: Optional[UUID] = Field(None, description="Topic ID if filtered by topic")
    topic_name: Optional[str] = Field(None, description="Topic name if filtered by topic")
    total: int = Field(..., description="Total number of trending repositories")


class TrendingQueryParams(BaseModel):
    """Query parameters for trending endpoints"""
    time_window: str = Field("daily", pattern="^(daily|weekly|monthly)$", description="Time window")
    topic_filter: Optional[UUID] = Field(None, description="Optional topic UUID filter")
    limit: int = Field(20, ge=1, le=100, description="Number of results")
    offset: int = Field(0, ge=0, description="Offset for pagination")


class TrendingStatsResponse(BaseModel):
    """Statistics about trending calculations"""
    topics_processed: int
    repositories_scored: int
    last_calculation: Optional[datetime] = None
    cache_status: dict = Field(default_factory=dict)


class TimeWindowOption(BaseModel):
    """Time window option for frontend"""
    value: str
    label: str
    description: str


class TrendingConfigResponse(BaseModel):
    """Trending configuration for frontend"""
    time_windows: List[TimeWindowOption] = [
        TimeWindowOption(
            value="daily",
            label="Daily",
            description="Trending over the last 7 days"
        ),
        TimeWindowOption(
            value="weekly",
            label="Weekly",
            description="Trending over the last 30 days"
        ),
        TimeWindowOption(
            value="monthly",
            label="Monthly",
            description="Trending over the last 90 days"
        )
    ]
    default_window: str = "daily"
    cache_ttl: dict = {
        "daily": 300,   # 5 minutes
        "weekly": 900,  # 15 minutes
        "monthly": 1800 # 30 minutes
    }
