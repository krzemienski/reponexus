# Import all models here to ensure they are registered with SQLAlchemy
from app.models.user import User
from app.models.repository import Repository
from app.models.topic import Topic, UserTopic

__all__ = ["User", "Repository", "Topic", "UserTopic"]
