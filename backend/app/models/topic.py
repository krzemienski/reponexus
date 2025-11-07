from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.db import Base


class Topic(Base):
    """
    Topic model representing a GitHub topic
    """

    __tablename__ = "topics"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Topic Info
    name = Column(String, unique=True, index=True, nullable=False)
    display_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    repository_count = Column(Integer, default=0)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    followers = relationship("UserTopic", back_populates="topic", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Topic(id={self.id}, name={self.name})>"


class UserTopic(Base):
    """
    User-Topic relationship model for followed topics
    """

    __tablename__ = "user_topics"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id"), nullable=False, index=True)

    # Settings
    is_following = Column(Boolean, default=True)
    notification_enabled = Column(Boolean, default=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="followed_topics")
    topic = relationship("Topic", back_populates="followers")

    def __repr__(self) -> str:
        return f"<UserTopic(user_id={self.user_id}, topic_id={self.topic_id})>"
