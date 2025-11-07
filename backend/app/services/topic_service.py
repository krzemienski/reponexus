"""
Topic service for business logic
"""

from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, or_
from datetime import datetime
from uuid import UUID

from app.models.topic import Topic, UserTopic
from app.models.repository import Repository
from app.schemas.topic import TopicCreate, TopicUpdate


class TopicService:
    """Service for topic operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_topics(
        self,
        page: int = 1,
        per_page: int = 20,
        search: Optional[str] = None,
        user_id: Optional[UUID] = None,
    ) -> Tuple[List[Topic], int]:
        """Get topics with pagination and search"""

        # Build query
        query = select(Topic)

        # Apply search filter
        if search:
            search_filter = or_(
                Topic.name.ilike(f"%{search}%"),
                Topic.display_name.ilike(f"%{search}%"),
                Topic.description.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)

        # Apply sorting (by repository count)
        query = query.order_by(desc(Topic.repository_count))

        # Get total count
        count_query = select(func.count()).select_from(Topic)
        if search:
            count_query = count_query.where(search_filter)
        result = await self.db.execute(count_query)
        total = result.scalar() or 0

        # Apply pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)

        # Execute query
        result = await self.db.execute(query)
        topics = result.scalars().all()

        # Add is_following flag if user_id provided
        if user_id:
            topics = await self._add_following_flag(topics, user_id)

        return list(topics), total

    async def get_topic(
        self, topic_id: UUID, user_id: Optional[UUID] = None
    ) -> Optional[Topic]:
        """Get topic by ID"""
        query = select(Topic).where(Topic.id == topic_id)
        result = await self.db.execute(query)
        topic = result.scalar_one_or_none()

        if topic and user_id:
            topics_with_flag = await self._add_following_flag([topic], user_id)
            return topics_with_flag[0] if topics_with_flag else topic

        return topic

    async def get_topic_by_name(
        self, name: str, user_id: Optional[UUID] = None
    ) -> Optional[Topic]:
        """Get topic by name"""
        query = select(Topic).where(Topic.name == name)
        result = await self.db.execute(query)
        topic = result.scalar_one_or_none()

        if topic and user_id:
            topics_with_flag = await self._add_following_flag([topic], user_id)
            return topics_with_flag[0] if topics_with_flag else topic

        return topic

    async def create_topic(self, topic_data: TopicCreate) -> Topic:
        """Create a new topic"""
        topic = Topic(**topic_data.model_dump())
        self.db.add(topic)
        await self.db.commit()
        await self.db.refresh(topic)
        return topic

    async def update_topic(
        self, topic_id: UUID, topic_data: TopicUpdate
    ) -> Optional[Topic]:
        """Update topic"""
        topic = await self.get_topic(topic_id)
        if not topic:
            return None

        update_data = topic_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(topic, field, value)

        await self.db.commit()
        await self.db.refresh(topic)
        return topic

    async def follow_topic(
        self, topic_id: UUID, user_id: UUID, notification_enabled: bool = True
    ) -> Tuple[Topic, UserTopic]:
        """Follow a topic"""
        # Check if already following
        query = select(UserTopic).where(
            and_(
                UserTopic.user_id == user_id,
                UserTopic.topic_id == topic_id
            )
        )
        result = await self.db.execute(query)
        existing = result.scalar_one_or_none()

        if existing:
            existing.is_following = True
            existing.notification_enabled = notification_enabled
            await self.db.commit()
            await self.db.refresh(existing)
            topic = await self.get_topic(topic_id)
            return topic, existing

        # Create user-topic relationship
        user_topic = UserTopic(
            user_id=user_id,
            topic_id=topic_id,
            is_following=True,
            notification_enabled=notification_enabled,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        self.db.add(user_topic)
        await self.db.commit()
        await self.db.refresh(user_topic)

        topic = await self.get_topic(topic_id, user_id)
        return topic, user_topic

    async def unfollow_topic(
        self, topic_id: UUID, user_id: UUID
    ) -> Optional[Topic]:
        """Unfollow a topic"""
        # Find user-topic relationship
        query = select(UserTopic).where(
            and_(
                UserTopic.user_id == user_id,
                UserTopic.topic_id == topic_id
            )
        )
        result = await self.db.execute(query)
        user_topic = result.scalar_one_or_none()

        if user_topic:
            # Mark as not following (or delete)
            user_topic.is_following = False
            await self.db.commit()

        return await self.get_topic(topic_id, user_id)

    async def get_topic_repositories(
        self,
        topic_name: str,
        page: int = 1,
        per_page: int = 20,
        sort: str = "stars",
    ) -> Tuple[List[Repository], int]:
        """Get repositories for a topic"""

        # Build query
        query = select(Repository).where(
            Repository.topics.contains([topic_name])
        )

        # Apply sorting
        if sort == "stars":
            query = query.order_by(desc(Repository.stargazer_count))
        elif sort == "updated":
            query = query.order_by(desc(Repository.updated_at))
        elif sort == "created":
            query = query.order_by(desc(Repository.created_at))

        # Get total count
        count_query = select(func.count()).select_from(Repository).where(
            Repository.topics.contains([topic_name])
        )
        result = await self.db.execute(count_query)
        total = result.scalar() or 0

        # Apply pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)

        # Execute query
        result = await self.db.execute(query)
        repositories = list(result.scalars().all())

        return repositories, total

    async def get_user_topics(
        self, user_id: UUID
    ) -> List[Topic]:
        """Get topics followed by user"""
        query = (
            select(Topic)
            .join(UserTopic)
            .where(
                and_(
                    UserTopic.user_id == user_id,
                    UserTopic.is_following == True
                )
            )
            .order_by(desc(Topic.repository_count))
        )

        result = await self.db.execute(query)
        topics = list(result.scalars().all())

        # Add is_following flag (all are following since we filtered)
        for topic in topics:
            topic.is_following = True

        return topics

    async def search_topics(
        self, query: str, limit: int = 20
    ) -> List[Topic]:
        """Search topics"""
        search_filter = or_(
            Topic.name.ilike(f"%{query}%"),
            Topic.display_name.ilike(f"%{query}%"),
            Topic.description.ilike(f"%{query}%"),
        )

        search_query = (
            select(Topic)
            .where(search_filter)
            .order_by(desc(Topic.repository_count))
            .limit(limit)
        )

        result = await self.db.execute(search_query)
        return list(result.scalars().all())

    async def _add_following_flag(
        self, topics: List[Topic], user_id: UUID
    ) -> List[Topic]:
        """Add is_following flag to topics"""
        if not topics:
            return []

        topic_ids = [topic.id for topic in topics]
        query = select(UserTopic.topic_id).where(
            and_(
                UserTopic.user_id == user_id,
                UserTopic.topic_id.in_(topic_ids),
                UserTopic.is_following == True
            )
        )
        result = await self.db.execute(query)
        following_ids = set(result.scalars().all())

        for topic in topics:
            topic.is_following = topic.id in following_ids

        return topics
