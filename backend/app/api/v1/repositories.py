from fastapi import APIRouter, Depends, Query, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.core.rate_limit import rate_limit
from app.dependencies import get_current_user, get_optional_current_user
from app.models.user import User
from app.services.repository_service import RepositoryService
from app.services.github_service import GitHubService
from app.schemas.repository import (
    RepositoryListResponse,
    RepositoryResponse,
    ReadmeResponse,
    StarRepositoryResponse,
    UnstarRepositoryResponse,
    TrendingRepository,
)
from app.schemas.common import PaginatedResponse, PaginationMetadata
from typing import Optional, List
from uuid import UUID
from datetime import datetime

router = APIRouter()


@router.get("", response_model=PaginatedResponse[RepositoryListResponse])
@rate_limit(requests=60, window=60)
async def list_repositories(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort: str = Query("stars", pattern="^(stars|updated|created)$"),
    language: Optional[str] = None,
    topic: Optional[str] = None,
    min_stars: Optional[int] = Query(None, ge=0),
    is_fork: Optional[bool] = None,
    is_archived: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    List repositories with pagination and filters
    """
    service = RepositoryService(db)

    user_id = current_user.id if current_user else None
    repositories, total = await service.get_repositories(
        page=page,
        per_page=per_page,
        sort=sort,
        language=language,
        topic=topic,
        min_stars=min_stars,
        is_fork=is_fork,
        is_archived=is_archived,
        user_id=user_id,
    )

    pages = (total + per_page - 1) // per_page

    return PaginatedResponse(
        data=[RepositoryListResponse.model_validate(repo) for repo in repositories],
        pagination=PaginationMetadata(
            total=total,
            page=page,
            per_page=per_page,
            pages=pages,
        ),
    )


@router.get("/trending", response_model=List[TrendingRepository])
@rate_limit(requests=60, window=60)
async def get_trending(
    request: Request,
    period: str = Query("daily", pattern="^(daily|weekly|monthly)$"),
    language: Optional[str] = None,
    limit: int = Query(25, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Get trending repositories
    """
    service = RepositoryService(db)
    repositories = await service.get_trending_repositories(
        period=period,
        language=language,
        limit=limit,
    )

    return [TrendingRepository.model_validate(repo) for repo in repositories]


@router.get("/{repo_id}", response_model=RepositoryResponse)
@rate_limit(requests=60, window=60)
async def get_repository(
    request: Request,
    repo_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Get repository by ID
    """
    service = RepositoryService(db)
    user_id = current_user.id if current_user else None

    repository = await service.get_repository(repo_id, user_id)

    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found",
        )

    return RepositoryResponse.model_validate(repository)


@router.get("/{repo_id}/readme", response_model=ReadmeResponse)
@rate_limit(requests=60, window=60)
async def get_readme(
    request: Request,
    repo_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get repository README
    """
    service = RepositoryService(db)
    github_service = GitHubService()

    repository = await service.get_repository(repo_id)
    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found",
        )

    readme_content = await service.get_readme(repo_id, github_service)

    if not readme_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="README not found",
        )

    return ReadmeResponse(
        content=readme_content,
        encoding="markdown",
        size=len(readme_content),
        cached=True,
        last_updated=datetime.utcnow(),
    )


@router.post("/{repo_id}/star", response_model=StarRepositoryResponse)
@rate_limit(requests=30, window=60)
async def star_repository(
    request: Request,
    repo_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Star a repository
    """
    service = RepositoryService(db)

    repository, starred = await service.star_repository(repo_id, current_user.id)

    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found",
        )

    return StarRepositoryResponse(
        message="Repository starred successfully",
        starred=True,
        starred_at=starred.starred_at,
        repository=RepositoryListResponse.model_validate(repository),
    )


@router.delete("/{repo_id}/star", response_model=UnstarRepositoryResponse)
@rate_limit(requests=30, window=60)
async def unstar_repository(
    request: Request,
    repo_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Unstar a repository
    """
    service = RepositoryService(db)

    repository = await service.unstar_repository(repo_id, current_user.id)

    if not repository:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found",
        )

    return UnstarRepositoryResponse(
        message="Repository unstarred successfully",
        starred=False,
    )
