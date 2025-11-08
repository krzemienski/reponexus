from fastapi import APIRouter, Depends, HTTPException, status, Request, Body
from app.core.rate_limit import rate_limit
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.sync import (
    SyncRequest,
    SyncResponse,
    SyncStatusResponse,
    UserSyncStatusResponse,
)
from app.services.github_sync_service import get_sync_service
from app.workers.sync_tasks import sync_starred_repos, get_sync_progress
from typing import Optional

router = APIRouter()


@router.post("/starred", response_model=SyncResponse)
@rate_limit(requests=5, window=300)  # 5 requests per 5 minutes
async def trigger_starred_sync(
    request: Request,
    sync_request: SyncRequest = Body(default=SyncRequest()),
    current_user: User = Depends(get_current_user),
):
    """
    Trigger sync of user's starred repositories from GitHub

    This starts a background task that:
    1. Fetches all starred repos from GitHub
    2. Updates repository data in database
    3. Creates starred_repository relationships
    4. Automatically generates topic suggestions after completion

    Rate limited to prevent abuse.
    """
    try:
        # Start background sync task
        task = sync_starred_repos.delay(
            str(current_user.id),
            sync_request.max_repos
        )

        return SyncResponse(
            success=True,
            task_id=task.id,
            message="Starred repos sync started",
            user_id=current_user.id
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start sync: {str(e)}"
        )


@router.get("/status/{task_id}", response_model=SyncStatusResponse)
@rate_limit(requests=30, window=60)
async def get_sync_status(
    request: Request,
    task_id: str,
    current_user: User = Depends(get_current_user),
):
    """
    Check the status of a sync task

    Returns:
    - status: PENDING, STARTED, SUCCESS, FAILURE, RETRY
    - ready: Whether the task has completed
    - successful: Whether the task completed successfully (if ready)
    - result: Task result (if successful)
    - error: Error message (if failed)
    """
    try:
        progress = get_sync_progress(task_id)

        return SyncStatusResponse(
            task_id=task_id,
            status=progress["status"],
            ready=progress["ready"],
            successful=progress.get("successful"),
            result=progress.get("result"),
            error=progress.get("error")
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sync status: {str(e)}"
        )


@router.get("/user-status", response_model=UserSyncStatusResponse)
@rate_limit(requests=30, window=60)
async def get_user_sync_status(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Get user's sync status and statistics

    Returns:
    - total_starred: Number of starred repos in database
    - last_sync_at: When the last sync occurred
    - has_synced: Whether user has synced at least once
    """
    try:
        sync_service = get_sync_service()
        status_data = await sync_service.get_sync_status(str(current_user.id))

        return UserSyncStatusResponse(**status_data)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get user sync status: {str(e)}"
        )
