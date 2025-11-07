# Import all models here to ensure they are registered with SQLAlchemy
from app.models.user import User
from app.models.repository import Repository
from app.models.topic import Topic, UserTopic
from app.models.audit_log import AuditLog
from app.models.starred_repository import StarredRepository
from app.models.analytics import AnalyticsEvent

__all__ = ["User", "Repository", "Topic", "UserTopic", "AuditLog", "StarredRepository", "AnalyticsEvent"]
