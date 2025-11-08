from fastapi import APIRouter, Depends, Query, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.core.rate_limit import rate_limit
from app.dependencies import get_current_user
from app.models.user import User
from app.services.notification_service import NotificationService
from app.schemas.notification import (
    NotificationResponse,
    NotificationListResponse,
    MarkAllReadResponse,
)
from app.schemas.common import PaginatedResponse, PaginationMetadata
from typing import Dict
from uuid import UUID

router = APIRouter()


@router.get("", response_model=PaginatedResponse[NotificationListResponse])
@rate_limit(requests=60, window=60)
async def list_notifications(
    request: Request,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List user notifications with pagination

    Returns paginated list of notifications for the authenticated user.
    Can optionally filter to show only unread notifications.
    """
    service = NotificationService(db)

    notifications, total = await service.get_notifications(
        user_id=current_user.id,
        page=page,
        per_page=per_page,
        unread_only=unread_only,
    )

    pages = (total + per_page - 1) // per_page

    return PaginatedResponse(
        data=[NotificationListResponse.model_validate(notif) for notif in notifications],
        pagination=PaginationMetadata(
            total=total,
            page=page,
            per_page=per_page,
            pages=pages,
        ),
    )


@router.get("/unread", response_model=Dict[str, int])
@rate_limit(requests=60, window=60)
async def get_unread_count(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get count of unread notifications

    Returns the total number of unread notifications for the authenticated user.
    Useful for displaying notification badges in the UI.
    """
    service = NotificationService(db)

    unread_count = await service.get_unread_count(current_user.id)

    return {"unread_count": unread_count}


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
@rate_limit(requests=60, window=60)
async def mark_notification_as_read(
    request: Request,
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a notification as read

    Marks the specified notification as read and records the timestamp.
    Only the notification owner can mark it as read.
    """
    service = NotificationService(db)

    notification = await service.mark_as_read(notification_id, current_user.id)

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    return NotificationResponse.model_validate(notification)


@router.patch("/read-all", response_model=MarkAllReadResponse)
@rate_limit(requests=30, window=60)
async def mark_all_notifications_as_read(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark all notifications as read

    Marks all unread notifications for the authenticated user as read.
    Returns the count of notifications that were updated.
    """
    service = NotificationService(db)

    updated_count = await service.mark_all_as_read(current_user.id)

    return MarkAllReadResponse(
        updated_count=updated_count,
        message=f"Successfully marked {updated_count} notification(s) as read",
    )


@router.delete("/{notification_id}")
@rate_limit(requests=60, window=60)
async def delete_notification(
    request: Request,
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a notification

    Permanently deletes the specified notification.
    Only the notification owner can delete it.
    """
    service = NotificationService(db)

    success = await service.delete_notification(notification_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    return {
        "message": "Notification deleted successfully",
        "notification_id": notification_id,
    }
