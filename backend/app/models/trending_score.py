from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.db import Base


class TrendingScore(Base):
    """
    TrendingScore model for storing calculated trending scores for repositories within topics
    Supports time-windowed trending calculations (daily, weekly, monthly)
    """

    __tablename__ = "trending_scores"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    repository_id = Column(UUID(as_uuid=True), ForeignKey("repositories.id"), nullable=False, index=True)
    topic_id = Column(UUID(as_uuid=True), ForeignKey("topics.id"), nullable=False, index=True)

    # Trending Scores (0-100 scale)
    trending_score = Column(Float, default=0.0, index=True)  # Final weighted score

    # Component Scores (0-100 scale for each)
    star_growth_rate = Column(Float, default=0.0)  # 35% weight
    activity_score = Column(Float, default=0.0)    # 25% weight
    community_score = Column(Float, default=0.0)   # 20% weight
    recency_score = Column(Float, default=0.0)     # 15% weight
    quality_score = Column(Float, default=0.0)     # 5% weight

    # Time Window
    time_window = Column(String(20), nullable=False, index=True)  # 'daily', 'weekly', 'monthly'

    # Metadata
    calculated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    repository = relationship("Repository", backref="trending_scores")
    topic = relationship("Topic", backref="trending_scores")

    # Composite indexes for efficient queries
    __table_args__ = (
        Index('ix_trending_topic_window_score', 'topic_id', 'time_window', 'trending_score'),
        Index('ix_trending_repo_topic_window', 'repository_id', 'topic_id', 'time_window', unique=True),
    )

    def __repr__(self) -> str:
        return f"<TrendingScore(repo_id={self.repository_id}, topic_id={self.topic_id}, score={self.trending_score}, window={self.time_window})>"
