from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.core.db import Base


class Repository(Base):
    """
    Repository model representing a GitHub repository
    """

    __tablename__ = "repositories"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # GitHub Info
    github_id = Column(String, unique=True, index=True, nullable=False)
    node_id = Column(String, unique=True, nullable=False)
    name_with_owner = Column(String, index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    owner_login = Column(String, index=True, nullable=False)

    # Details
    description = Column(String, nullable=True)
    is_private = Column(Boolean, default=False)
    is_fork = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)

    # Stats
    stargazer_count = Column(Integer, default=0, index=True)
    watcher_count = Column(Integer, default=0)
    fork_count = Column(Integer, default=0)
    open_issues_count = Column(Integer, default=0)

    # Language & Topics
    primary_language = Column(String, nullable=True, index=True)
    languages = Column(JSON, default=dict)  # {"TypeScript": 5000, "JavaScript": 3000}
    topics = Column(JSON, default=list)  # ["react", "typescript"]

    # URLs
    html_url = Column(String, nullable=False)
    api_url = Column(String, nullable=False)
    clone_url = Column(String, nullable=True)

    # Timestamps
    created_at = Column(DateTime, nullable=False)
    updated_at = Column(DateTime, nullable=False)
    pushed_at = Column(DateTime, nullable=True)
    last_fetched_at = Column(DateTime, default=datetime.utcnow)

    # Analytics
    trending_score = Column(Integer, default=0)
    quality_score = Column(Integer, default=0)

    def __repr__(self) -> str:
        return f"<Repository(id={self.id}, name_with_owner={self.name_with_owner})>"
