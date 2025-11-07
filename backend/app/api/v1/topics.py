from fastapi import APIRouter, Depends, Query, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.core.rate_limit import rate_limit
from app.dependencies import get_current_user, get_optional_current_user
from app.models.user import User
from app.services.topic_service import TopicService
from app.schemas.topic import (
    TopicListResponse,
    TopicResponse,
    FollowTopicResponse,
    UnfollowTopicResponse,
)
from app.schemas.repository import RepositoryListResponse
from app.schemas.common import PaginatedResponse, PaginationMetadata
from typing import Optional, List
from uuid import UUID

router = APIRouter()


@router.get("", response_model=PaginatedResponse[TopicListResponse])
@rate_limit(requests=60, window=60)
async def list_topics(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    List topics with pagination
    """
    service = TopicService(db)
    user_id = current_user.id if current_user else None

    topics, total = await service.get_topics(
        page=page,
        per_page=per_page,
        search=search,
        user_id=user_id,
    )

    pages = (total + per_page - 1) // per_page

    return PaginatedResponse(
        data=[TopicListResponse.model_validate(topic) for topic in topics],
        pagination=PaginationMetadata(
            total=total,
            page=page,
            per_page=per_page,
            pages=pages,
        ),
    )


@router.get("/{topic_id}", response_model=TopicResponse)
@rate_limit(requests=60, window=60)
async def get_topic(
    request: Request,
    topic_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Get topic by ID
    """
    service = TopicService(db)
    user_id = current_user.id if current_user else None

    topic = await service.get_topic(topic_id, user_id)

    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found",
        )

    return TopicResponse.model_validate(topic)


@router.post("/{topic_id}/follow", response_model=FollowTopicResponse)
@rate_limit(requests=30, window=60)
async def follow_topic(
    request: Request,
    topic_id: UUID,
    notification_enabled: bool = Query(True),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Follow a topic
    """
    service = TopicService(db)

    topic, user_topic = await service.follow_topic(
        topic_id,
        current_user.id,
        notification_enabled=notification_enabled,
    )

    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found",
        )

    return FollowTopicResponse(
        message="Topic followed successfully",
        following=True,
        followed_at=user_topic.created_at,
        topic=TopicListResponse.model_validate(topic),
    )


@router.delete("/{topic_id}/follow", response_model=UnfollowTopicResponse)
@rate_limit(requests=30, window=60)
async def unfollow_topic(
    request: Request,
    topic_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Unfollow a topic
    """
    service = TopicService(db)

    topic = await service.unfollow_topic(topic_id, current_user.id)

    if not topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Topic not found",
        )

    return UnfollowTopicResponse(
        message="Topic unfollowed successfully",
        following=False,
    )


@router.get("/{topic_name}/repositories", response_model=PaginatedResponse[RepositoryListResponse])
@rate_limit(requests=60, window=60)
async def get_topic_repositories(
    request: Request,
    topic_name: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort: str = Query("stars", regex="^(stars|updated|created)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get repositories for a topic
    """
    service = TopicService(db)

    repositories, total = await service.get_topic_repositories(
        topic_name=topic_name,
        page=page,
        per_page=per_page,
        sort=sort,
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
