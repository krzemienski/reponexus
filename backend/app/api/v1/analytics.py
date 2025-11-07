from fastapi import APIRouter, Depends, Query, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.core.rate_limit import rate_limit
from app.dependencies import get_current_user, get_optional_current_user
from app.models.user import User
from app.services.analytics_service import AnalyticsService
from app.schemas.analytics import (
    AnalyticsEventCreate,
    AnalyticsEventResponse,
    AnalyticsDashboardResponse,
    UserAnalyticsResponse,
    RepositoryAnalyticsResponse,
    SearchAnalyticsResponse,
)
from typing import Optional
from datetime import datetime
from uuid import UUID

router = APIRouter()


@router.post("/events", response_model=AnalyticsEventResponse, status_code=status.HTTP_201_CREATED)
@rate_limit(requests=100, window=60)
async def track_event(
    request: Request,
    event_data: AnalyticsEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Track an analytics event
    """
    service = AnalyticsService(db)

    # Set user_id from authenticated user if not provided
    if current_user and not event_data.user_id:
        event_data.user_id = current_user.id

    # Set IP address and user agent from request if not provided
    if not event_data.ip_address:
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            event_data.ip_address = forwarded_for.split(",")[0].strip()
        else:
            event_data.ip_address = request.client.host if request.client else "unknown"

    if not event_data.user_agent:
        event_data.user_agent = request.headers.get("User-Agent", "unknown")

    if not event_data.referrer:
        event_data.referrer = request.headers.get("Referer")

    event = await service.track_event(event_data)

    return AnalyticsEventResponse.model_validate(event)


@router.get("/dashboard", response_model=AnalyticsDashboardResponse)
@rate_limit(requests=30, window=60)
async def get_dashboard(
    request: Request,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get dashboard analytics (admin only in production)
    """
    service = AnalyticsService(db)

    analytics = await service.get_dashboard_analytics(
        start_date=start_date,
        end_date=end_date,
    )

    return AnalyticsDashboardResponse(**analytics)


@router.get("/users/{user_id}", response_model=UserAnalyticsResponse)
@rate_limit(requests=30, window=60)
async def get_user_analytics(
    request: Request,
    user_id: UUID,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get analytics for a specific user
    """
    # Only allow users to view their own analytics
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own analytics",
        )

    service = AnalyticsService(db)

    analytics = await service.get_user_analytics(
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
    )

    return UserAnalyticsResponse(**analytics)


@router.get("/repositories/{repository_id}", response_model=RepositoryAnalyticsResponse)
@rate_limit(requests=30, window=60)
async def get_repository_analytics(
    request: Request,
    repository_id: UUID,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get analytics for a specific repository
    """
    service = AnalyticsService(db)

    analytics = await service.get_repository_analytics(
        repository_id=repository_id,
        start_date=start_date,
        end_date=end_date,
    )

    return RepositoryAnalyticsResponse(**analytics)


@router.get("/search", response_model=SearchAnalyticsResponse)
@rate_limit(requests=30, window=60)
async def get_search_analytics(
    request: Request,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get search analytics (admin only in production)
    """
    service = AnalyticsService(db)

    analytics = await service.get_search_analytics(
        start_date=start_date,
        end_date=end_date,
    )

    return SearchAnalyticsResponse(**analytics)
