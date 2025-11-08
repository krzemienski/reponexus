from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.core.rate_limit import rate_limit
from app.dependencies import get_current_user
from app.models.user import User
from app.services.settings_service import SettingsService
from app.schemas.settings import SettingsResponse, SettingsUpdate

router = APIRouter()


@router.get("", response_model=SettingsResponse)
@rate_limit(requests=60, window=60)
async def get_user_settings(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get user settings

    Retrieves the current settings for the authenticated user.
    If settings don't exist yet, they will be created with default values.
    """
    service = SettingsService(db)

    settings = await service.get_or_create_settings(current_user.id)

    return SettingsResponse.model_validate(settings)


@router.patch("", response_model=SettingsResponse)
@rate_limit(requests=30, window=60)
async def update_user_settings(
    request: Request,
    settings_update: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update user settings

    Updates the settings for the authenticated user.
    Only the provided fields will be updated; unspecified fields remain unchanged.

    Available settings:
    - theme: UI theme preference (light, dark, auto)
    - notifications_enabled: Enable/disable all notifications
    - email_notifications: Enable/disable email notifications
    - language: Language code (e.g., 'en', 'es', 'fr')
    - timezone: Timezone string (e.g., 'UTC', 'America/New_York')
    """
    service = SettingsService(db)

    settings = await service.update_settings(current_user.id, settings_update)

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update settings",
        )

    return SettingsResponse.model_validate(settings)
