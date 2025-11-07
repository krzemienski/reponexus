"""
Pydantic schemas for request/response models
"""

from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserInDB,
    UserResponse,
    UserProfileResponse,
    UserListResponse,
    UserStats,
)
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RefreshResponse,
    TokenData,
)
from app.schemas.repository import (
    RepositoryBase,
    RepositoryCreate,
    RepositoryUpdate,
    RepositoryResponse,
    RepositoryDetailResponse,
    RepositoryListResponse,
    TrendingRepository,
    ReadmeResponse,
    StarRepositoryResponse,
    UnstarRepositoryResponse,
    RepositoryStatsResponse,
)
from app.schemas.topic import (
    TopicBase,
    TopicCreate,
    TopicUpdate,
    TopicResponse,
    TopicListResponse,
    TopicDetailResponse,
    FollowTopicResponse,
    UnfollowTopicResponse,
    UserTopicResponse,
    TopicStatsResponse,
)
from app.schemas.analytics import (
    AnalyticsEventBase,
    AnalyticsEventCreate,
    AnalyticsEventResponse,
    AnalyticsDashboardResponse,
    UserAnalyticsResponse,
    RepositoryAnalyticsResponse,
    SearchAnalyticsResponse,
    EngagementMetrics,
    TrendingMetrics,
)
from app.schemas.common import (
    PaginationParams,
    PaginationMetadata,
    PaginatedResponse,
    SortOrder,
    DateRangeFilter,
    RepositoryFilters,
    SearchFilters,
    ErrorResponse,
    SuccessResponse,
)

__all__ = [
    # User schemas
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserInDB",
    "UserResponse",
    "UserProfileResponse",
    "UserListResponse",
    "UserStats",
    # Auth schemas
    "LoginRequest",
    "LoginResponse",
    "RefreshRequest",
    "RefreshResponse",
    "TokenData",
    # Repository schemas
    "RepositoryBase",
    "RepositoryCreate",
    "RepositoryUpdate",
    "RepositoryResponse",
    "RepositoryDetailResponse",
    "RepositoryListResponse",
    "TrendingRepository",
    "ReadmeResponse",
    "StarRepositoryResponse",
    "UnstarRepositoryResponse",
    "RepositoryStatsResponse",
    # Topic schemas
    "TopicBase",
    "TopicCreate",
    "TopicUpdate",
    "TopicResponse",
    "TopicListResponse",
    "TopicDetailResponse",
    "FollowTopicResponse",
    "UnfollowTopicResponse",
    "UserTopicResponse",
    "TopicStatsResponse",
    # Analytics schemas
    "AnalyticsEventBase",
    "AnalyticsEventCreate",
    "AnalyticsEventResponse",
    "AnalyticsDashboardResponse",
    "UserAnalyticsResponse",
    "RepositoryAnalyticsResponse",
    "SearchAnalyticsResponse",
    "EngagementMetrics",
    "TrendingMetrics",
    # Common schemas
    "PaginationParams",
    "PaginationMetadata",
    "PaginatedResponse",
    "SortOrder",
    "DateRangeFilter",
    "RepositoryFilters",
    "SearchFilters",
    "ErrorResponse",
    "SuccessResponse",
]
