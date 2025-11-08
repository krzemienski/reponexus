from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class ExampleRepository(BaseModel):
    """Example repository in suggestion"""
    id: UUID
    name_with_owner: str
    description: Optional[str] = None
    stargazer_count: int
    primary_language: Optional[str] = None


class TopicSuggestionBase(BaseModel):
    """Base topic suggestion schema"""
    relevance_score: int = Field(..., ge=0, le=100)
    starred_repo_count: int = Field(..., ge=0)
    reason: Optional[str] = None


class TopicSuggestionResponse(TopicSuggestionBase):
    """Schema for topic suggestion response"""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    topic_id: UUID
    topic_name: str
    topic_display_name: str
    is_dismissed: bool = False
    is_accepted: bool = False
    suggested_at: datetime
    example_repos: Optional[List[ExampleRepository]] = None


class TopicSuggestionListResponse(BaseModel):
    """List of topic suggestions"""
    suggestions: List[TopicSuggestionResponse]
    total: int
    has_more: bool = False


class GenerateSuggestionsResponse(BaseModel):
    """Response after generating suggestions"""
    success: bool
    suggestions_generated: int
    suggestions_saved: int
    message: str = "Suggestions generated successfully"


class DismissSuggestionResponse(BaseModel):
    """Response after dismissing a suggestion"""
    success: bool
    message: str = "Suggestion dismissed"
    suggestion_id: UUID


class AcceptSuggestionResponse(BaseModel):
    """Response after accepting a suggestion"""
    success: bool
    message: str = "Suggestion accepted, now following topic"
    suggestion_id: UUID
    topic_id: UUID
    topic_name: str
