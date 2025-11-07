from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db

router = APIRouter()


@router.get("/repositories")
async def search_repositories(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    sort: str = Query("stars", regex="^(stars|forks|updated)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    Search repositories
    """
    # TODO: Implement repository search
    return {
        "data": [],
        "total_count": 0,
        "incomplete_results": False,
        "pagination": {"total": 0, "page": page, "per_page": per_page, "pages": 0},
    }


@router.get("/topics")
async def search_topics(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
):
    """
    Search topics
    """
    # TODO: Implement topic search
    return {"data": [], "total_count": 0}


@router.get("/users")
async def search_users(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Search users
    """
    # TODO: Implement user search
    return {
        "data": [],
        "total_count": 0,
        "pagination": {"total": 0, "page": page, "per_page": per_page, "pages": 0},
    }
