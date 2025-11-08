"""
Explore API Endpoints - Trending repositories from followed topics
"""
from fastapi import APIRouter, Depends, Query, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from uuid import UUID

from app.core.db import get_db
from app.core.rate_limit import rate_limit
from app.dependencies import get_current_user, get_optional_current_user
from app.models.user import User
from app.services.trending_service import TrendingService
from app.schemas.trending import (
    TrendingListResponse,
    TrendingRepositoryResponse,
    TrendingConfigResponse,
    TrendingStatsResponse
)
from app.schemas.common import PaginatedResponse, PaginationMetadata
from app.models.trending_score import TrendingScore

router = APIRouter()


@router.get("/trending", response_model=PaginatedResponse[TrendingRepositoryResponse])
@rate_limit(requests=60, window=60)
async def get_trending_repositories(
    request: Request,
    time_window: str = Query("daily", regex="^(daily|weekly|monthly)$"),
    topic_filter: Optional[UUID] = Query(None, description="Optional topic UUID to filter by"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get trending repositories from user's followed topics

    Query Parameters:
    - time_window: Time window for trending (daily/weekly/monthly)
    - topic_filter: Optional topic UUID to filter results
    - page: Page number
    - per_page: Results per page
    """
    service = TrendingService(db)

    # Calculate offset
    offset = (page - 1) * per_page

    # Get trending repos for user's topics
    repositories, total = await service.get_trending_repos_for_user_topics(
        user_id=current_user.id,
        time_window=time_window,
        topic_filter=topic_filter,
        limit=per_page,
        offset=offset
    )

    # Get trending scores for these repositories
    repo_scores = {}
    if repositories:
        from sqlalchemy import select, and_

        repo_ids = [repo.id for repo in repositories]

        # Get trending scores for these repos
        stmt = select(TrendingScore).where(
            and_(
                TrendingScore.repository_id.in_(repo_ids),
                TrendingScore.time_window == time_window
            )
        )
        result = await db.execute(stmt)
        scores = result.scalars().all()

        # Map scores by repository ID
        for score in scores:
            repo_scores[score.repository_id] = score

    # Build response with trending information
    trending_repos = []
    for repo in repositories:
        repo_dict = {
            "id": repo.id,
            "github_id": repo.github_id,
            "name_with_owner": repo.name_with_owner,
            "name": repo.name,
            "owner_login": repo.owner_login,
            "description": repo.description,
            "stargazer_count": repo.stargazer_count,
            "fork_count": repo.fork_count,
            "open_issues_count": repo.open_issues_count,
            "primary_language": repo.primary_language,
            "topics": repo.topics or [],
            "html_url": repo.html_url,
            "created_at": repo.created_at,
            "updated_at": repo.updated_at,
            "pushed_at": repo.pushed_at,
        }

        # Add trending information if available
        score = repo_scores.get(repo.id)
        if score:
            repo_dict.update({
                "trending_score": score.trending_score,
                "star_growth_rate": score.star_growth_rate,
                "activity_score": score.activity_score,
                "community_score": score.community_score,
                "recency_score": score.recency_score,
                "quality_score": score.quality_score,
                "trending_time_window": score.time_window,
                "trending_calculated_at": score.calculated_at,
            })

        trending_repos.append(TrendingRepositoryResponse(**repo_dict))

    # Calculate pagination
    pages = (total + per_page - 1) // per_page

    return PaginatedResponse(
        data=trending_repos,
        pagination=PaginationMetadata(
            total=total,
            page=page,
            per_page=per_page,
            pages=pages,
        ),
    )


@router.get("/trending/config", response_model=TrendingConfigResponse)
@rate_limit(requests=60, window=60)
async def get_trending_config(
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Get trending configuration options for frontend

    Returns available time windows and cache settings
    """
    return TrendingConfigResponse()


@router.get("/trending/stats", response_model=TrendingStatsResponse)
@rate_limit(requests=60, window=60)
async def get_trending_stats(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get trending calculation statistics

    Returns information about trending score calculations
    """
    from sqlalchemy import select, func
    from app.models.trending_score import TrendingScore

    # Get total topics processed
    stmt = select(func.count(func.distinct(TrendingScore.topic_id)))
    result = await db.execute(stmt)
    topics_processed = result.scalar() or 0

    # Get total repositories scored
    stmt = select(func.count(func.distinct(TrendingScore.repository_id)))
    result = await db.execute(stmt)
    repositories_scored = result.scalar() or 0

    # Get last calculation time
    stmt = select(func.max(TrendingScore.calculated_at))
    result = await db.execute(stmt)
    last_calculation = result.scalar()

    return TrendingStatsResponse(
        topics_processed=topics_processed,
        repositories_scored=repositories_scored,
        last_calculation=last_calculation,
        cache_status={
            "daily_ttl": 300,
            "weekly_ttl": 900,
            "monthly_ttl": 1800
        }
    )


@router.get("/featured", response_model=PaginatedResponse[TrendingRepositoryResponse])
@rate_limit(requests=60, window=60)
async def get_featured_repositories(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get featured repositories (top trending across all topics)

    This endpoint shows globally trending repositories, not topic-specific
    """
    from sqlalchemy import select, desc
    from app.models.repository import Repository
    from app.models.trending_score import TrendingScore

    # Calculate offset
    offset = (page - 1) * per_page

    # Get top trending repositories across all topics
    stmt = (
        select(Repository, TrendingScore)
        .join(TrendingScore, Repository.id == TrendingScore.repository_id)
        .where(TrendingScore.time_window == "daily")
        .order_by(desc(TrendingScore.trending_score))
        .limit(per_page)
        .offset(offset)
    )

    result = await db.execute(stmt)
    rows = result.all()

    # Build response
    trending_repos = []
    for repo, score in rows:
        repo_dict = {
            "id": repo.id,
            "github_id": repo.github_id,
            "name_with_owner": repo.name_with_owner,
            "name": repo.name,
            "owner_login": repo.owner_login,
            "description": repo.description,
            "stargazer_count": repo.stargazer_count,
            "fork_count": repo.fork_count,
            "open_issues_count": repo.open_issues_count,
            "primary_language": repo.primary_language,
            "topics": repo.topics or [],
            "html_url": repo.html_url,
            "created_at": repo.created_at,
            "updated_at": repo.updated_at,
            "pushed_at": repo.pushed_at,
            "trending_score": score.trending_score,
            "star_growth_rate": score.star_growth_rate,
            "activity_score": score.activity_score,
            "community_score": score.community_score,
            "recency_score": score.recency_score,
            "quality_score": score.quality_score,
            "trending_time_window": score.time_window,
            "trending_calculated_at": score.calculated_at,
        }
        trending_repos.append(TrendingRepositoryResponse(**repo_dict))

    # Get total count
    count_stmt = select(func.count(TrendingScore.id)).where(
        TrendingScore.time_window == "daily"
    )
    count_result = await db.execute(count_stmt)
    total = count_result.scalar() or 0

    pages = (total + per_page - 1) // per_page

    return PaginatedResponse(
        data=trending_repos,
        pagination=PaginationMetadata(
            total=total,
            page=page,
            per_page=per_page,
            pages=pages,
        ),
    )
