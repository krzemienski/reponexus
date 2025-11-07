from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.db import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RefreshResponse,
    LogoutResponse,
)
from app.schemas.user import UserResponse
from app.services.auth_service import AuthService
from app.services.audit_service import AuditService
from app.core.config import settings

router = APIRouter()


def get_client_info(request: Request) -> tuple[Optional[str], Optional[str]]:
    """
    Extract client IP address and user agent from request

    Args:
        request: FastAPI request object

    Returns:
        Tuple of (ip_address, user_agent)
    """
    # Get IP address from X-Forwarded-For header or direct connection
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        ip_address = forwarded_for.split(",")[0].strip()
    else:
        ip_address = request.client.host if request.client else None

    user_agent = request.headers.get("User-Agent")

    return ip_address, user_agent


@router.post("/login")
async def login(db: AsyncSession = Depends(get_db)):
    """
    OAuth login with GitHub - Returns GitHub OAuth URL

    Note: This endpoint returns the GitHub OAuth URL for the frontend to redirect to.
    The actual authentication happens in the /callback endpoint.
    """
    github_oauth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.GITHUB_CALLBACK_URL}"
        f"&scope=read:user user:email"
    )

    return {
        "auth_url": github_oauth_url,
        "message": "Redirect user to this URL to authenticate with GitHub",
    }


@router.post("/callback", response_model=LoginResponse)
async def callback(
    request: Request,
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    OAuth callback handler - Exchange code for tokens and authenticate user

    This endpoint:
    1. Exchanges the OAuth code for a GitHub access token
    2. Fetches user data from GitHub
    3. Creates or updates the user in the database
    4. Generates JWT tokens for the user
    5. Creates a session in Redis
    6. Logs the login event
    """
    auth_service = AuthService(db)
    audit_service = AuditService(db)

    # Get client information for logging
    ip_address, user_agent = get_client_info(request)

    try:
        # 1. Exchange OAuth code for GitHub access token
        github_access_token = await auth_service.exchange_code_for_token(login_data.code)

        # 2. Fetch user data from GitHub
        github_user_data = await auth_service.get_github_user(github_access_token)

        # 3. Create or update user in database
        user = await auth_service.create_or_update_user(
            github_data=github_user_data,
            access_token=github_access_token,
        )

        # 4. Create session and generate tokens
        tokens = await auth_service.create_session(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        # 5. Log successful login
        await audit_service.log_login_success(
            user=user,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        # 6. Return login response with tokens and user data
        return LoginResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            token_type=tokens["token_type"],
            expires_in=tokens["expires_in"],
            user=UserResponse.model_validate(user),
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log failed login attempt
        await audit_service.log_login_failure(
            reason=str(e),
            ip_address=ip_address,
            user_agent=user_agent,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}",
        )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(
    request: Request,
    refresh_data: RefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh access token using refresh token

    This endpoint:
    1. Validates the refresh token
    2. Generates a new access token
    3. Updates the session in Redis
    4. Logs the token refresh event
    """
    auth_service = AuthService(db)
    audit_service = AuditService(db)

    # Get client information for logging
    ip_address, user_agent = get_client_info(request)

    try:
        # 1. Refresh access token
        tokens = await auth_service.refresh_access_token(refresh_data.refresh_token)

        # 2. Get user for logging (from token)
        from app.core.security import decode_token

        payload = decode_token(tokens["access_token"])
        if payload:
            user_id = payload.get("sub")
            from sqlalchemy import select

            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()

            if user:
                # 3. Log token refresh
                await audit_service.log_token_refresh(
                    user=user,
                    ip_address=ip_address,
                    user_agent=user_agent,
                )

        # 4. Return new access token
        return RefreshResponse(
            access_token=tokens["access_token"],
            token_type=tokens["token_type"],
            expires_in=tokens["expires_in"],
        )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}",
        )


@router.post("/logout", response_model=LogoutResponse)
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Logout user and invalidate tokens

    This endpoint:
    1. Revokes the user's tokens (removes from Redis)
    2. Clears the session
    3. Logs the logout event
    """
    auth_service = AuthService(db)
    audit_service = AuditService(db)

    # Get client information for logging
    ip_address, user_agent = get_client_info(request)

    try:
        # 1. Revoke tokens and clear session
        await auth_service.revoke_token(str(current_user.id))

        # 2. Log logout event
        await audit_service.log_logout(
            user=current_user,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        # 3. Return success response
        return LogoutResponse(
            message="Successfully logged out",
            success=True,
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout failed: {str(e)}",
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information

    This endpoint returns detailed information about the currently authenticated user.
    Requires a valid access token in the Authorization header.
    """
    return UserResponse.model_validate(current_user)
