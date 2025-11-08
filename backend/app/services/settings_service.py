"""
Settings service for managing user settings
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.models.settings import Settings, ThemeType
from app.schemas.settings import SettingsCreate, SettingsUpdate


class SettingsService:
    """Service for settings operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_settings(self, user_id: UUID) -> Optional[Settings]:
        """Get user settings"""

        query = select(Settings).where(Settings.user_id == user_id)

        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_or_create_settings(self, user_id: UUID) -> Settings:
        """Get user settings or create default if not exists"""

        settings = await self.get_settings(user_id)

        if not settings:
            settings = await self.create_settings(user_id)

        return settings

    async def create_settings(
        self, user_id: UUID, settings_data: Optional[SettingsCreate] = None
    ) -> Settings:
        """Create new settings for user"""

        if settings_data:
            settings = Settings(
                user_id=user_id,
                theme=settings_data.theme,
                notifications_enabled=settings_data.notifications_enabled,
                email_notifications=settings_data.email_notifications,
                language=settings_data.language,
                timezone=settings_data.timezone,
            )
        else:
            # Create with defaults
            settings = Settings(user_id=user_id)

        self.db.add(settings)
        await self.db.commit()
        await self.db.refresh(settings)

        return settings

    async def update_settings(
        self, user_id: UUID, settings_update: SettingsUpdate
    ) -> Optional[Settings]:
        """Update user settings"""

        settings = await self.get_settings(user_id)

        if not settings:
            # Create settings if not exists
            settings = await self.create_settings(user_id)

        # Update fields
        update_data = settings_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)

        await self.db.commit()
        await self.db.refresh(settings)

        return settings

    async def delete_settings(self, user_id: UUID) -> bool:
        """Delete user settings"""

        settings = await self.get_settings(user_id)

        if not settings:
            return False

        await self.db.delete(settings)
        await self.db.commit()

        return True

    async def reset_settings(self, user_id: UUID) -> Settings:
        """Reset user settings to defaults"""

        settings = await self.get_settings(user_id)

        if not settings:
            # Create with defaults
            return await self.create_settings(user_id)

        # Reset to defaults
        settings.theme = ThemeType.AUTO
        settings.notifications_enabled = True
        settings.email_notifications = True
        settings.language = "en"
        settings.timezone = "UTC"

        await self.db.commit()
        await self.db.refresh(settings)

        return settings
