"""
Token-based authentication endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.db import get_db
from app.services.github_token_service import GitHubTokenService
from app.services.auth_service import AuthService
from app.schemas.auth_token import (
    TokenLoginRequest,
    TokenLoginResponse,
    GitHubUserInfo,
)
from app.schemas.auth import GitHubUserData
from app.schemas.user import UserResponse


router = APIRouter()


@router.post("/token", response_model=TokenLoginResponse, status_code=status.HTTP_200_OK)
async def login_with_token(
    request: Request,
    login_data: TokenLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user with GitHub personal access token

    This endpoint allows users to authenticate using a GitHub personal access token
    instead of OAuth flow. Useful for testing and automation.

    **Flow:**
    1. Verify the provided GitHub token
    2. Fetch user information from GitHub API
    3. Create or update user in database
    4. Generate JWT access token
    5. Return JWT and user information

    **Args:**
    - github_token: GitHub personal access token (starts with ghp_, gho_, or ghs_)

    **Returns:**
    - access_token: JWT token for API authentication
    - token_type: Always "bearer"
    - expires_in: Token expiration time in seconds
    - user: User information from GitHub

    **Example:**
    ```json
    {
        "github_token": "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
    ```
    """
    # Initialize GitHub token service
    github_service = GitHubTokenService(login_data.github_token)

    # Verify token is valid
    is_valid = await github_service.verify_token()
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid GitHub token",
        )

    # Get user information from GitHub
    user_info = await github_service.get_user_info()

    # Convert to GitHubUserData schema
    github_data = GitHubUserData(**user_info)

    # Initialize auth service
    auth_service = AuthService(db)

    # Create or update user in database
    user = await auth_service.create_or_update_user(
        github_data=github_data,
        access_token=login_data.github_token,
    )

    # Get client information
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    # Create session and generate JWT
    session_data = await auth_service.create_session(
        user=user,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    # Convert user to response schema
    user_response = UserResponse.model_validate(user)

    # Return login response
    return TokenLoginResponse(
        access_token=session_data["access_token"],
        token_type=session_data["token_type"],
        expires_in=session_data["expires_in"],
        user=user_response,
    )


@router.get("/token/verify", status_code=status.HTTP_200_OK)
async def verify_github_token(
    github_token: str,
):
    """
    Verify if a GitHub token is valid

    This is a utility endpoint to check if a GitHub token is valid
    without performing full authentication.

    **Args:**
    - github_token: GitHub personal access token

    **Returns:**
    - valid: Boolean indicating if token is valid
    - message: Status message
    """
    github_service = GitHubTokenService(github_token)
    is_valid = await github_service.verify_token()

    return {
        "valid": is_valid,
        "message": "Token is valid" if is_valid else "Token is invalid",
    }
