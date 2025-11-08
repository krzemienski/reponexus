"""
Notification Pydantic schemas
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class NotificationType(str, Enum):
    """Enumeration of notification types"""
    STAR = "star"
    FOLLOW = "follow"
    MENTION = "mention"
    SYSTEM = "system"


class NotificationBase(BaseModel):
    """
    Base notification schema with common fields
    """
    type: NotificationType = Field(..., description="Type of notification")
    title: str = Field(..., min_length=1, max_length=200, description="Notification title")
    message: str = Field(..., min_length=1, max_length=1000, description="Notification message")
    link: Optional[str] = Field(None, max_length=500, description="Optional link URL")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Validate notification title"""
        if not v or not v.strip():
            raise ValueError("Notification title cannot be empty")
        return v.strip()

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        """Validate notification message"""
        if not v or not v.strip():
            raise ValueError("Notification message cannot be empty")
        return v.strip()


class NotificationCreate(NotificationBase):
    """
    Schema for creating a new notification
    """
    user_id: UUID = Field(..., description="User ID to receive the notification")


class NotificationUpdate(BaseModel):
    """
    Schema for updating notification
    """
    is_read: bool = Field(..., description="Read status")


class NotificationResponse(NotificationBase):
    """
    Schema for notification response
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(..., description="Notification ID")
    user_id: UUID = Field(..., description="User ID")
    is_read: bool = Field(..., description="Read status")
    created_at: datetime = Field(..., description="Creation timestamp")
    read_at: Optional[datetime] = Field(None, description="Read timestamp")


class NotificationListResponse(BaseModel):
    """
    Lighter notification response for lists
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    type: NotificationType
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool
    created_at: datetime


class NotificationStatsResponse(BaseModel):
    """
    Schema for notification statistics
    """
    total_notifications: int = Field(..., ge=0, description="Total number of notifications")
    unread_count: int = Field(..., ge=0, description="Number of unread notifications")
    notifications_by_type: dict = Field(default_factory=dict, description="Notification counts by type")


class MarkAllReadResponse(BaseModel):
    """
    Schema for mark all notifications as read response
    """
    updated_count: int = Field(..., ge=0, description="Number of notifications marked as read")
    message: str = Field(..., description="Success message")


class BulkNotificationCreate(BaseModel):
    """
    Schema for creating multiple notifications at once
    """
    user_ids: List[UUID] = Field(..., min_length=1, description="List of user IDs")
    type: NotificationType = Field(..., description="Type of notification")
    title: str = Field(..., min_length=1, max_length=200, description="Notification title")
    message: str = Field(..., min_length=1, max_length=1000, description="Notification message")
    link: Optional[str] = Field(None, max_length=500, description="Optional link URL")
