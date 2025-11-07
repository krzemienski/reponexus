from pydantic import BaseModel, Field, field_validator
from typing import Generic, TypeVar, Optional, List
from datetime import datetime

T = TypeVar('T')


class PaginationParams(BaseModel):
    """Common pagination parameters"""
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")


class PaginationMetadata(BaseModel):
    """Pagination metadata in response"""
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page")
    per_page: int = Field(..., description="Items per page")
    pages: int = Field(..., description="Total number of pages")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response"""
    data: List[T]
    pagination: PaginationMetadata


class SortOrder(BaseModel):
    """Sorting parameters"""
    field: str
    order: str = Field("desc", pattern="^(asc|desc)$")


class DateRangeFilter(BaseModel):
    """Date range filter"""
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None


class RepositoryFilters(BaseModel):
    """Repository filtering parameters"""
    language: Optional[str] = None
    topic: Optional[str] = None
    min_stars: Optional[int] = Field(None, ge=0)
    max_stars: Optional[int] = Field(None, ge=0)
    is_fork: Optional[bool] = None
    is_archived: Optional[bool] = None
    created_after: Optional[datetime] = None
    created_before: Optional[datetime] = None
    updated_after: Optional[datetime] = None
    updated_before: Optional[datetime] = None

    @field_validator('max_stars')
    @classmethod
    def validate_star_range(cls, v, info):
        if v is not None and info.data.get('min_stars') is not None:
            if v < info.data['min_stars']:
                raise ValueError('max_stars must be greater than or equal to min_stars')
        return v


class SearchFilters(BaseModel):
    """Search filtering parameters"""
    query: str = Field(..., min_length=1, max_length=256)
    language: Optional[str] = None
    topic: Optional[str] = None
    min_stars: Optional[int] = Field(None, ge=0)
    sort: str = Field("stars", pattern="^(stars|forks|updated|created)$")
    order: str = Field("desc", pattern="^(asc|desc)$")


class ErrorResponse(BaseModel):
    """Standard error response"""
    detail: str
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SuccessResponse(BaseModel):
    """Standard success response"""
    message: str
    data: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
