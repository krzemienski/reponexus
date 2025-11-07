from sqlalchemy import Column, String, Integer, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.core.db import Base


class User(Base):
    """
    User model representing a GitHub user
    """

    __tablename__ = "users"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # GitHub Info
    github_id = Column(String, unique=True, index=True, nullable=False)
    login = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    company = Column(String, nullable=True)
    location = Column(String, nullable=True)
    blog = Column(String, nullable=True)
    twitter_username = Column(String, nullable=True)

    # Stats
    public_repos = Column(Integer, default=0)
    public_gists = Column(Integer, default=0)
    followers = Column(Integer, default=0)
    following = Column(Integer, default=0)

    # Authentication
    access_token = Column(String, nullable=True)
    refresh_token = Column(String, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<User(id={self.id}, login={self.login})>"
