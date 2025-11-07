from sqlalchemy import Column, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.core.db import Base


class StarredRepository(Base):
    """
    StarredRepository model representing user-repository star relationships
    """

    __tablename__ = "starred_repositories"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign Keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    repository_id = Column(UUID(as_uuid=True), ForeignKey("repositories.id"), nullable=False, index=True)

    # Metadata
    starred_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="starred_repositories")
    repository = relationship("Repository", back_populates="starred_by")

    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'repository_id', name='uq_user_repository_star'),
    )

    def __repr__(self) -> str:
        return f"<StarredRepository(user_id={self.user_id}, repository_id={self.repository_id})>"
