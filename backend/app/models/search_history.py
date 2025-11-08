"""
SearchHistory model for tracking user search queries
"""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.db import Base


class SearchResultType(str, enum.Enum):
    """Enumeration of search result types"""
    REPOSITORY = "repository"
    TOPIC = "topic"
    USER = "user"


class SearchHistory(Base):
    """
    SearchHistory model for tracking user searches and providing autocomplete
    """

    __tablename__ = "search_history"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # Search Information
    query = Column(String, nullable=False, index=True)
    result_type = Column(Enum(SearchResultType), nullable=False)
    result_count = Column(Integer, default=0, nullable=False)

    # Analytics
    ip_address = Column(String, nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="search_history")

    # Indexes for common queries
    __table_args__ = (
        Index("idx_search_history_user_created", "user_id", "created_at"),
        Index("idx_search_history_query", "query"),
    )

    def __repr__(self) -> str:
        return f"<SearchHistory(id={self.id}, user_id={self.user_id}, query={self.query})>"
