from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.schema import ForeignKey
from datetime import datetime
import uuid
import enum

from app.core.db import Base


class ThemeMode(str, enum.Enum):
    """Theme mode options"""
    LIGHT = "light"
    DARK = "dark"
    SYSTEM = "system"


class UserSettings(Base):
    """
    User settings model for user preferences
    """

    __tablename__ = "user_settings"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User relationship (one-to-one)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    # Theme settings
    theme = Column(SQLEnum(ThemeMode), default=ThemeMode.SYSTEM, nullable=False)

    # Notification preferences
    email_notifications = Column(Boolean, default=True, nullable=False)
    push_notifications = Column(Boolean, default=True, nullable=False)
    repository_updates = Column(Boolean, default=True, nullable=False)
    topic_updates = Column(Boolean, default=True, nullable=False)
    trending_notifications = Column(Boolean, default=False, nullable=False)

    # Display preferences
    items_per_page = Column(String(10), default="20", nullable=False)  # "10", "20", "50", "100"
    default_sort = Column(String(20), default="stars", nullable=False)  # "stars", "updated", "created"

    # Privacy settings
    profile_public = Column(Boolean, default=True, nullable=False)
    show_email = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self) -> str:
        return f"<UserSettings(id={self.id}, user_id={self.user_id}, theme={self.theme})>"
