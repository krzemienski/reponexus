from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.dependencies import get_current_user
from app.models.user import User
from typing import Optional

router = APIRouter()


@router.get("")
async def list_topics(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    List topics with pagination
    """
    # TODO: Implement topic listing
    return {
        "data": [],
        "pagination": {"total": 0, "page": page, "per_page": per_page, "pages": 0},
    }


@router.get("/{topic_id}")
async def get_topic(topic_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get topic by ID
    """
    # TODO: Implement topic detail
    return {"message": f"Topic {topic_id} - Implementation pending"}


@router.post("/{topic_id}/follow")
async def follow_topic(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Follow a topic
    """
    # TODO: Implement follow functionality
    return {"message": "Topic followed"}


@router.delete("/{topic_id}/follow")
async def unfollow_topic(
    topic_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Unfollow a topic
    """
    # TODO: Implement unfollow functionality
    return {"message": "Topic unfollowed"}


@router.get("/{topic_name}/repositories")
async def get_topic_repositories(
    topic_name: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Get repositories for a topic
    """
    # TODO: Implement topic repositories
    return {
        "data": [],
        "pagination": {"total": 0, "page": page, "per_page": per_page, "pages": 0},
    }
