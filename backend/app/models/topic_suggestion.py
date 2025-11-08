from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.db import Base


class TopicSuggestion(Base):
    """
    TopicSuggestion model representing suggested topics for users based on their starred repos
    """

    __tablename__ = "topic_suggestions"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id"), nullable=False, index=True)

    # Suggestion Data
    relevance_score = Column(Integer, default=0)  # 0-100 score
    starred_repo_count = Column(Integer, default=0)  # Number of starred repos with this topic
    reason = Column(Text, nullable=True)  # Human-readable explanation

    # User Actions
    is_dismissed = Column(Boolean, default=False)
    is_accepted = Column(Boolean, default=False)

    # Metadata
    suggested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    dismissed_at = Column(DateTime, nullable=True)
    accepted_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="topic_suggestions")
    topic = relationship("Topic", back_populates="suggestions")

    def __repr__(self) -> str:
        return f"<TopicSuggestion(user_id={self.user_id}, topic_id={self.topic_id}, score={self.relevance_score})>"
