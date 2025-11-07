from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("/me")
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current user profile
    """
    return {
        "id": str(current_user.id),
        "login": current_user.login,
        "name": current_user.name,
        "email": current_user.email,
        "avatar_url": current_user.avatar_url,
        "bio": current_user.bio,
        "company": current_user.company,
        "location": current_user.location,
        "public_repos": current_user.public_repos,
        "followers": current_user.followers,
        "following": current_user.following,
    }


@router.patch("/me")
async def update_current_user(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update current user profile
    """
    # TODO: Implement profile update
    return {"message": "Profile updated"}


@router.get("/me/starred")
async def get_starred_repositories(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get starred repositories for current user
    """
    # TODO: Implement starred repositories
    return {
        "data": [],
        "pagination": {"total": 0, "page": page, "per_page": per_page, "pages": 0},
    }


@router.get("/me/topics")
async def get_user_topics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get followed topics for current user
    """
    # TODO: Implement user topics
    return {"data": []}


@router.get("/{login}")
async def get_user(login: str, db: AsyncSession = Depends(get_db)):
    """
    Get user by login
    """
    # TODO: Implement user lookup
    return {"message": f"User {login} - Implementation pending"}
