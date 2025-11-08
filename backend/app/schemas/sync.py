from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID


class SyncRequest(BaseModel):
    """Request to trigger starred repos sync"""
    max_repos: Optional[int] = Field(None, ge=1, le=1000)


class SyncResponse(BaseModel):
    """Response after triggering sync"""
    success: bool
    task_id: str
    message: str = "Sync started"
    user_id: UUID


class SyncStatusResponse(BaseModel):
    """Sync task status response"""
    task_id: str
    status: str  # PENDING, STARTED, SUCCESS, FAILURE, RETRY
    ready: bool
    successful: Optional[bool] = None
    result: Optional[dict] = None
    error: Optional[str] = None


class SyncStatsResponse(BaseModel):
    """Sync statistics response"""
    success: bool
    total_starred: int
    repos_created: int
    repos_updated: int
    stars_created: int
    stars_updated: int


class UserSyncStatusResponse(BaseModel):
    """User's sync status"""
    total_starred: int
    last_sync_at: Optional[datetime] = None
    has_synced: bool
