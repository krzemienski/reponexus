"""
Notification service for managing user notifications
"""

from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, delete, desc
from uuid import UUID
from datetime import datetime

from app.models.notification import Notification, NotificationType
from app.schemas.notification import NotificationCreate


class NotificationService:
    """Service for notification operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_notifications(
        self,
        user_id: UUID,
        page: int = 1,
        per_page: int = 20,
        unread_only: bool = False,
    ) -> Tuple[List[Notification], int]:
        """Get user notifications with pagination"""

        # Build query
        query = select(Notification).where(Notification.user_id == user_id)

        if unread_only:
            query = query.where(Notification.is_read == False)

        query = query.order_by(desc(Notification.created_at))

        # Get total count
        count_query = select(func.count()).select_from(Notification).where(
            Notification.user_id == user_id
        )
        if unread_only:
            count_query = count_query.where(Notification.is_read == False)

        result = await self.db.execute(count_query)
        total = result.scalar() or 0

        # Apply pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)

        # Execute query
        result = await self.db.execute(query)
        notifications = list(result.scalars().all())

        return notifications, total

    async def get_unread_count(self, user_id: UUID) -> int:
        """Get count of unread notifications for user"""

        query = (
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
        )

        result = await self.db.execute(query)
        return result.scalar() or 0

    async def get_notification(
        self, notification_id: UUID, user_id: UUID
    ) -> Optional[Notification]:
        """Get notification by ID for specific user"""

        query = select(Notification).where(
            Notification.id == notification_id, Notification.user_id == user_id
        )

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_notification(
        self, notification_data: NotificationCreate
    ) -> Notification:
        """Create new notification"""

        notification = Notification(
            user_id=notification_data.user_id,
            type=notification_data.type,
            title=notification_data.title,
            message=notification_data.message,
            link=notification_data.link,
        )

        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)

        return notification

    async def mark_as_read(
        self, notification_id: UUID, user_id: UUID
    ) -> Optional[Notification]:
        """Mark notification as read"""

        notification = await self.get_notification(notification_id, user_id)

        if not notification:
            return None

        notification.is_read = True
        notification.read_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(notification)

        return notification

    async def mark_all_as_read(self, user_id: UUID) -> int:
        """Mark all notifications as read for user"""

        stmt = (
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read == False)
            .values(is_read=True, read_at=datetime.utcnow())
        )

        result = await self.db.execute(stmt)
        await self.db.commit()

        return result.rowcount

    async def delete_notification(
        self, notification_id: UUID, user_id: UUID
    ) -> bool:
        """Delete notification"""

        notification = await self.get_notification(notification_id, user_id)

        if not notification:
            return False

        await self.db.delete(notification)
        await self.db.commit()

        return True

    async def delete_old_notifications(self, user_id: UUID, days: int = 30) -> int:
        """Delete notifications older than specified days"""

        from datetime import timedelta

        cutoff_date = datetime.utcnow() - timedelta(days=days)

        stmt = delete(Notification).where(
            Notification.user_id == user_id, Notification.created_at < cutoff_date
        )

        result = await self.db.execute(stmt)
        await self.db.commit()

        return result.rowcount
