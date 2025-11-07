from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/login")
async def login(db: AsyncSession = Depends(get_db)):
    """
    OAuth login with GitHub
    """
    # TODO: Implement OAuth login
    return {"message": "Login endpoint - Implementation pending"}


@router.post("/callback")
async def callback(db: AsyncSession = Depends(get_db)):
    """
    OAuth callback handler
    """
    # TODO: Implement callback handling
    return {"message": "Callback endpoint - Implementation pending"}


@router.post("/refresh")
async def refresh_token(db: AsyncSession = Depends(get_db)):
    """
    Refresh access token
    """
    # TODO: Implement token refresh
    return {"message": "Refresh endpoint - Implementation pending"}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout user
    """
    # TODO: Implement logout
    return {"message": "Logout successful"}


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user
    """
    return {
        "id": str(current_user.id),
        "login": current_user.login,
        "name": current_user.name,
        "email": current_user.email,
        "avatar_url": current_user.avatar_url,
    }
