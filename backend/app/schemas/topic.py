from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class TopicBase(BaseModel):
    """Base topic schema"""
    name: str = Field(..., min_length=1, max_length=100)
    display_name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


class TopicCreate(TopicBase):
    """Schema for creating a topic"""
    repository_count: int = Field(0, ge=0)


class TopicUpdate(BaseModel):
    """Schema for updating a topic"""
    display_name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    repository_count: Optional[int] = Field(None, ge=0)


class TopicResponse(TopicBase):
    """Schema for topic response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    repository_count: int
    created_at: datetime
    updated_at: datetime
    is_following: Optional[bool] = None  # Computed field for current user
    follower_count: Optional[int] = None


class TopicListResponse(BaseModel):
    """Topic list item (lighter version)"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    display_name: str
    description: Optional[str] = None
    repository_count: int
    is_following: Optional[bool] = None


class TopicDetailResponse(TopicResponse):
    """Detailed topic response with additional data"""
    top_repositories: Optional[List] = None  # List of RepositoryListResponse
    related_topics: Optional[List[str]] = None
    trending: bool = False


class FollowTopicResponse(BaseModel):
    """Response after following a topic"""
    message: str = "Topic followed successfully"
    following: bool = True
    followed_at: datetime
    topic: TopicListResponse


class UnfollowTopicResponse(BaseModel):
    """Response after unfollowing a topic"""
    message: str = "Topic unfollowed successfully"
    following: bool = False


class UserTopicBase(BaseModel):
    """Base user-topic relationship schema"""
    is_following: bool = True
    notification_enabled: bool = True


class UserTopicCreate(UserTopicBase):
    """Schema for creating user-topic relationship"""
    user_id: UUID
    topic_id: UUID


class UserTopicUpdate(BaseModel):
    """Schema for updating user-topic relationship"""
    is_following: Optional[bool] = None
    notification_enabled: Optional[bool] = None


class UserTopicResponse(UserTopicBase):
    """Schema for user-topic response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    topic_id: UUID
    created_at: datetime
    updated_at: datetime
    topic: Optional[TopicListResponse] = None


class TopicStatsResponse(BaseModel):
    """Topic statistics"""
    total_topics: int
    total_repositories: int
    average_repositories_per_topic: float
    most_popular_topics: List[TopicListResponse]
    trending_topics: List[TopicListResponse]
