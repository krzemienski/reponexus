"""
Audit Log model for tracking authentication and security events
"""

from sqlalchemy import Column, String, DateTime, JSON, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.core.db import Base


class AuditLog(Base):
    """
    Audit log model for tracking security-related events
    """

    __tablename__ = "audit_logs"

    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Event Information
    event_type = Column(String, nullable=False, index=True)  # login, logout, token_refresh, etc.
    event_status = Column(String, nullable=False, index=True)  # success, failure
    event_message = Column(String, nullable=True)

    # User Information
    user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    user_login = Column(String, nullable=True)

    # Request Information
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    request_method = Column(String, nullable=True)
    request_path = Column(String, nullable=True)

    # Additional Data
    event_metadata = Column(JSON, nullable=True)  # Store additional event-specific data

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Indexes for common queries
    __table_args__ = (
        Index("idx_audit_logs_user_created", "user_id", "created_at"),
        Index("idx_audit_logs_event_created", "event_type", "created_at"),
        Index("idx_audit_logs_status_created", "event_status", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, event_type={self.event_type}, user_id={self.user_id})>"
