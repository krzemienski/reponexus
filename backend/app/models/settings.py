"""
Settings model for user preferences and app settings
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.db import Base


class ThemeType(str, enum.Enum):
    """Enumeration of theme types"""
    LIGHT = "light"
    DARK = "dark"
    AUTO = "auto"


class Settings(Base):
    """
    Settings model for managing user preferences and application settings
    """

    __tablename__ = "settings"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys (unique one-to-one relationship)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True, index=True)

    # Appearance Settings
    theme = Column(Enum(ThemeType), default=ThemeType.AUTO, nullable=False)

    # Notification Settings
    notifications_enabled = Column(Boolean, default=True, nullable=False)
    email_notifications = Column(Boolean, default=True, nullable=False)

    # Localization Settings
    language = Column(String, default="en", nullable=False)
    timezone = Column(String, default="UTC", nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships (one-to-one)
    user = relationship("User", back_populates="settings", uselist=False)

    def __repr__(self) -> str:
        return f"<Settings(id={self.id}, user_id={self.user_id}, theme={self.theme})>"
