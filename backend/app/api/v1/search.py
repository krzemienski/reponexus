from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.core.rate_limit import rate_limit
from app.dependencies import get_current_user, get_optional_current_user
from app.models.user import User
from app.services.search_service import SearchService
from app.schemas.repository import RepositoryListResponse
from app.schemas.topic import TopicListResponse
from app.schemas.user import UserListResponse
from app.schemas.common import PaginatedResponse, PaginationMetadata
from typing import Optional, Dict, Any, List

router = APIRouter()


@router.get("/repositories")
@rate_limit(requests=60, window=60)
async def search_repositories(
    request: Request,
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort: str = Query("stars", regex="^(stars|forks|updated|created)$"),
    language: Optional[str] = None,
    topic: Optional[str] = None,
    min_stars: Optional[int] = Query(None, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Search repositories
    """
    service = SearchService(db)

    repositories, total, incomplete_results = await service.search_repositories(
        query=q,
        page=page,
        per_page=per_page,
        sort=sort,
        language=language,
        topic=topic,
        min_stars=min_stars,
    )

    pages = (total + per_page - 1) // per_page

    return {
        "data": [RepositoryListResponse.model_validate(repo) for repo in repositories],
        "total_count": total,
        "incomplete_results": incomplete_results,
        "pagination": PaginationMetadata(
            total=total,
            page=page,
            per_page=per_page,
            pages=pages,
        ).model_dump(),
    }


@router.get("/topics")
@rate_limit(requests=60, window=60)
async def search_topics(
    request: Request,
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Search topics
    """
    service = SearchService(db)

    topics, total = await service.search_topics(
        query=q,
        limit=limit,
    )

    return {
        "data": [TopicListResponse.model_validate(topic) for topic in topics],
        "total_count": total,
    }


@router.get("/users")
@rate_limit(requests=60, window=60)
async def search_users(
    request: Request,
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Search users
    """
    service = SearchService(db)

    users, total = await service.search_users(
        query=q,
        page=page,
        per_page=per_page,
    )

    pages = (total + per_page - 1) // per_page

    return {
        "data": [UserListResponse.model_validate(user) for user in users],
        "total_count": total,
        "pagination": PaginationMetadata(
            total=total,
            page=page,
            per_page=per_page,
            pages=pages,
        ).model_dump(),
    }


@router.get("/all")
@rate_limit(requests=60, window=60)
async def search_all(
    request: Request,
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    """
    Search across all entities (repositories, topics, users)
    """
    service = SearchService(db)

    results = await service.search_all(
        query=q,
        limit=limit,
    )

    return {
        "repositories": [RepositoryListResponse.model_validate(repo) for repo in results["repositories"]],
        "topics": [TopicListResponse.model_validate(topic) for topic in results["topics"]],
        "users": [UserListResponse.model_validate(user) for user in results["users"]],
        "query": results["query"],
    }


@router.get("/suggestions")
@rate_limit(requests=60, window=60)
async def get_search_suggestions(
    request: Request,
    limit: int = Query(10, ge=1, le=50),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get search suggestions from history

    Returns recent search queries from the user's search history.
    Useful for autocomplete and quick search features.
    Requires authentication.
    """
    service = SearchService(db)

    user_id = current_user.id if current_user else None

    suggestions = await service.get_search_suggestions(
        user_id=user_id,
        limit=limit,
    )

    return {
        "suggestions": suggestions,
        "count": len(suggestions),
    }
