"""
Settings Pydantic schemas
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum


class ThemeType(str, Enum):
    """Enumeration of theme types"""
    LIGHT = "light"
    DARK = "dark"
    AUTO = "auto"


class SettingsBase(BaseModel):
    """
    Base settings schema with common fields
    """
    theme: ThemeType = Field(default=ThemeType.AUTO, description="UI theme preference")
    notifications_enabled: bool = Field(default=True, description="Enable/disable notifications")
    email_notifications: bool = Field(default=True, description="Enable/disable email notifications")
    language: str = Field(default="en", min_length=2, max_length=10, description="Language code")
    timezone: str = Field(default="UTC", min_length=1, max_length=50, description="Timezone")

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: str) -> str:
        """Validate language code"""
        if not v or not v.strip():
            raise ValueError("Language code cannot be empty")
        # Basic validation for common language codes
        v = v.strip().lower()
        if len(v) < 2:
            raise ValueError("Language code must be at least 2 characters")
        return v

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, v: str) -> str:
        """Validate timezone"""
        if not v or not v.strip():
            raise ValueError("Timezone cannot be empty")
        return v.strip()


class SettingsCreate(SettingsBase):
    """
    Schema for creating new settings
    """
    user_id: UUID = Field(..., description="User ID")


class SettingsUpdate(BaseModel):
    """
    Schema for updating settings
    """
    theme: Optional[ThemeType] = Field(None, description="UI theme preference")
    notifications_enabled: Optional[bool] = Field(None, description="Enable/disable notifications")
    email_notifications: Optional[bool] = Field(None, description="Enable/disable email notifications")
    language: Optional[str] = Field(None, min_length=2, max_length=10, description="Language code")
    timezone: Optional[str] = Field(None, min_length=1, max_length=50, description="Timezone")

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: Optional[str]) -> Optional[str]:
        """Validate language code"""
        if v is not None:
            if not v or not v.strip():
                raise ValueError("Language code cannot be empty")
            v = v.strip().lower()
            if len(v) < 2:
                raise ValueError("Language code must be at least 2 characters")
        return v

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, v: Optional[str]) -> Optional[str]:
        """Validate timezone"""
        if v is not None:
            if not v or not v.strip():
                raise ValueError("Timezone cannot be empty")
            v = v.strip()
        return v


class SettingsResponse(SettingsBase):
    """
    Schema for settings response
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID = Field(..., description="Settings ID")
    user_id: UUID = Field(..., description="User ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")


class SettingsPreferencesResponse(BaseModel):
    """
    Lighter settings response for preferences
    """
    model_config = ConfigDict(from_attributes=True)

    theme: ThemeType
    notifications_enabled: bool
    email_notifications: bool
    language: str
    timezone: str
