from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, Dict, List, Any
from datetime import datetime
from uuid import UUID


class AnalyticsEventBase(BaseModel):
    """Base analytics event schema"""
    event_type: str = Field(..., min_length=1, max_length=50)
    entity_type: Optional[str] = Field(None, max_length=50)
    entity_id: Optional[str] = Field(None, max_length=255)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AnalyticsEventCreate(AnalyticsEventBase):
    """Schema for creating an analytics event"""
    user_id: Optional[UUID] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    referrer: Optional[str] = None

    @field_validator('event_type')
    @classmethod
    def validate_event_type(cls, v):
        valid_types = [
            'view', 'click', 'search', 'star', 'unstar',
            'follow', 'unfollow', 'share', 'export', 'error'
        ]
        if v not in valid_types:
            raise ValueError(f'event_type must be one of: {", ".join(valid_types)}')
        return v

    @field_validator('entity_type')
    @classmethod
    def validate_entity_type(cls, v):
        if v is not None:
            valid_types = ['repository', 'topic', 'user', 'search', 'page']
            if v not in valid_types:
                raise ValueError(f'entity_type must be one of: {", ".join(valid_types)}')
        return v


class AnalyticsEventResponse(AnalyticsEventBase):
    """Schema for analytics event response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: Optional[UUID] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    referrer: Optional[str] = None
    created_at: datetime


class AnalyticsDashboardResponse(BaseModel):
    """Dashboard analytics response"""
    total_events: int
    total_users: int
    total_views: int
    total_searches: int
    total_stars: int
    total_follows: int
    events_by_type: Dict[str, int]
    events_by_date: List[Dict[str, Any]]
    top_repositories: List[Dict[str, Any]]
    top_topics: List[Dict[str, Any]]
    top_searches: List[Dict[str, Any]]
    user_growth: List[Dict[str, Any]]
    engagement_rate: float


class UserAnalyticsResponse(BaseModel):
    """User-specific analytics response"""
    user_id: UUID
    total_events: int
    total_views: int
    total_searches: int
    total_stars: int
    total_follows: int
    favorite_languages: List[str]
    favorite_topics: List[str]
    activity_by_date: List[Dict[str, Any]]
    recent_repositories: List[Dict[str, Any]]
    engagement_score: float


class RepositoryAnalyticsResponse(BaseModel):
    """Repository-specific analytics"""
    repository_id: UUID
    total_views: int
    total_stars: int
    unique_visitors: int
    views_by_date: List[Dict[str, Any]]
    stars_by_date: List[Dict[str, Any]]
    referrer_sources: Dict[str, int]
    geographic_distribution: Dict[str, int]


class SearchAnalyticsResponse(BaseModel):
    """Search analytics"""
    total_searches: int
    unique_queries: int
    top_queries: List[Dict[str, Any]]
    searches_by_date: List[Dict[str, Any]]
    average_results: float
    zero_result_queries: List[str]


class EngagementMetrics(BaseModel):
    """Engagement metrics"""
    daily_active_users: int
    weekly_active_users: int
    monthly_active_users: int
    average_session_duration: float
    bounce_rate: float
    return_visitor_rate: float
    page_views_per_session: float


class TrendingMetrics(BaseModel):
    """Trending content metrics"""
    trending_repositories: List[Dict[str, Any]]
    trending_topics: List[Dict[str, Any]]
    trending_searches: List[str]
    viral_coefficient: float
