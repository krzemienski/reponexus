"""
SearchHistory Pydantic schemas
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class SearchResultType(str, Enum):
    """Enumeration of search result types"""
    REPOSITORY = "repository"
    TOPIC = "topic"
    USER = "user"


class SearchHistoryBase(BaseModel):
    """
    Base search history schema with common fields
    """
    query: str = Field(..., min_length=1, max_length=500, description="Search query")
    result_type: SearchResultType = Field(..., description="Type of search results")
    result_count: int = Field(default=0, ge=0, description="Number of results returned")

    @field_validator("query")
    @classmethod
    def validate_query(cls, v: str) -> str:
        """Validate search query"""
        if not v or not v.strip():
            raise ValueError("Search query cannot be empty")
        return v.strip()


class SearchHistoryCreate(SearchHistoryBase):
    """
    Schema for creating a new search history entry
    """
    user_id: UUID = Field(..., description="User ID who performed the search")
    ip_address: Optional[str] = Field(None, max_length=45, description="IP address of the user")


class SearchHistoryResponse(SearchHistoryBase):
    """
    Schema for search history response
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(..., description="Search history entry ID")
    user_id: UUID = Field(..., description="User ID")
    ip_address: Optional[str] = Field(None, description="IP address")
    created_at: datetime = Field(..., description="Search timestamp")


class SearchHistoryListResponse(BaseModel):
    """
    Lighter search history response for lists
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    query: str
    result_type: SearchResultType
    result_count: int
    created_at: datetime


class SearchAutocompleteResponse(BaseModel):
    """
    Schema for search autocomplete suggestions
    """
    query: str = Field(..., description="Search query")
    count: int = Field(..., ge=0, description="Number of times searched")
    last_searched: datetime = Field(..., description="Last search timestamp")


class PopularSearchesResponse(BaseModel):
    """
    Schema for popular searches
    """
    query: str = Field(..., description="Search query")
    search_count: int = Field(..., ge=0, description="Number of searches")
    unique_users: int = Field(..., ge=0, description="Number of unique users")
    avg_result_count: float = Field(..., ge=0, description="Average result count")
