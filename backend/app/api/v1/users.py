from fastapi import APIRouter, Depends, Query, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.db import get_db
from app.core.rate_limit import rate_limit
from app.dependencies import get_current_user
from app.models.user import User
from app.models.starred_repository import StarredRepository
from app.models.repository import Repository
from app.services.topic_service import TopicService
from app.schemas.user import (
    UserProfileResponse,
    UserUpdate,
    UserListResponse,
)
from app.schemas.repository import RepositoryListResponse
from app.schemas.topic import TopicListResponse
from app.schemas.common import PaginatedResponse, PaginationMetadata
from typing import Optional, List

router = APIRouter()


@router.get("/me", response_model=UserProfileResponse)
@rate_limit(requests=60, window=60)
async def get_current_user_profile(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user profile
    """
    # Get starred count
    starred_query = select(func.count()).select_from(StarredRepository).where(
        StarredRepository.user_id == current_user.id
    )
    result = await db.execute(starred_query)
    starred_count = result.scalar() or 0

    # Get followed topics count
    from app.models.topic import UserTopic
    topics_query = select(func.count()).select_from(UserTopic).where(
        UserTopic.user_id == current_user.id,
        UserTopic.is_following == True
    )
    result = await db.execute(topics_query)
    followed_topics_count = result.scalar() or 0

    user_data = UserProfileResponse.model_validate(current_user)
    user_data.starred_count = starred_count
    user_data.followed_topics_count = followed_topics_count

    return user_data


@router.patch("/me", response_model=UserProfileResponse)
@rate_limit(requests=30, window=60)
async def update_current_user(
    request: Request,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update current user profile
    """
    # Update user fields
    update_data = user_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)

    await db.commit()
    await db.refresh(current_user)

    # Get counts
    starred_query = select(func.count()).select_from(StarredRepository).where(
        StarredRepository.user_id == current_user.id
    )
    result = await db.execute(starred_query)
    starred_count = result.scalar() or 0

    from app.models.topic import UserTopic
    topics_query = select(func.count()).select_from(UserTopic).where(
        UserTopic.user_id == current_user.id,
        UserTopic.is_following == True
    )
    result = await db.execute(topics_query)
    followed_topics_count = result.scalar() or 0

    user_data = UserProfileResponse.model_validate(current_user)
    user_data.starred_count = starred_count
    user_data.followed_topics_count = followed_topics_count

    return user_data


@router.get("/me/starred", response_model=PaginatedResponse[RepositoryListResponse])
@rate_limit(requests=60, window=60)
async def get_starred_repositories(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort: str = Query("starred_at", regex="^(starred_at|stars|updated)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get starred repositories for current user
    """
    # Build query
    from sqlalchemy.orm import selectinload
    from sqlalchemy import desc

    query = (
        select(Repository)
        .join(StarredRepository)
        .where(StarredRepository.user_id == current_user.id)
    )

    # Apply sorting
    if sort == "starred_at":
        query = query.order_by(desc(StarredRepository.starred_at))
    elif sort == "stars":
        query = query.order_by(desc(Repository.stargazer_count))
    elif sort == "updated":
        query = query.order_by(desc(Repository.updated_at))

    # Get total count
    count_query = select(func.count()).select_from(Repository).join(StarredRepository).where(
        StarredRepository.user_id == current_user.id
    )
    result = await db.execute(count_query)
    total = result.scalar() or 0

    # Apply pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    # Execute query
    result = await db.execute(query)
    repositories = list(result.scalars().all())

    # Mark all as starred
    for repo in repositories:
        repo.is_starred = True

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


@router.get("/me/topics", response_model=List[TopicListResponse])
@rate_limit(requests=60, window=60)
async def get_user_topics(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get followed topics for current user
    """
    service = TopicService(db)
    topics = await service.get_user_topics(current_user.id)

    return [TopicListResponse.model_validate(topic) for topic in topics]


@router.get("/{login}", response_model=UserListResponse)
@rate_limit(requests=60, window=60)
async def get_user(
    request: Request,
    login: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get user by login
    """
    query = select(User).where(User.login == login)
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserListResponse.model_validate(user)
