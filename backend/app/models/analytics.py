from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.db import Base


class AnalyticsEvent(Base):
    """
    AnalyticsEvent model for tracking user events and analytics
    """

    __tablename__ = "analytics_events"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys (nullable for anonymous events)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)

    # Event Details
    event_type = Column(String, nullable=False, index=True)  # "view", "star", "search", "click", etc.
    entity_type = Column(String, nullable=True)  # "repository", "topic", "user", etc.
    entity_id = Column(String, nullable=True)  # UUID or identifier of entity

    # Event Metadata
    metadata = Column(JSON, default=dict)  # Additional event-specific data

    # Request Info
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    referrer = Column(String, nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="analytics_events")

    def __repr__(self) -> str:
        return f"<AnalyticsEvent(id={self.id}, event_type={self.event_type}, entity_type={self.entity_type})>"
