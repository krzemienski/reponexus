"""
Analytics service for tracking and reporting
"""

from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from datetime import datetime, timedelta
from uuid import UUID

from app.models.analytics import AnalyticsEvent
from app.models.user import User
from app.models.repository import Repository
from app.models.topic import Topic
from app.schemas.analytics import AnalyticsEventCreate


class AnalyticsService:
    """Service for analytics operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def track_event(
        self,
        event_data: AnalyticsEventCreate,
    ) -> AnalyticsEvent:
        """Track an analytics event"""
        event = AnalyticsEvent(**event_data.model_dump())
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def get_dashboard_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Get dashboard analytics"""

        # Default to last 30 days
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        # Get total events
        events_query = select(func.count()).select_from(AnalyticsEvent).where(
            and_(
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at <= end_date,
            )
        )
        result = await self.db.execute(events_query)
        total_events = result.scalar() or 0

        # Get total users
        users_query = select(func.count()).select_from(User)
        result = await self.db.execute(users_query)
        total_users = result.scalar() or 0

        # Get events by type
        events_by_type_query = (
            select(
                AnalyticsEvent.event_type,
                func.count(AnalyticsEvent.id).label('count')
            )
            .where(
                and_(
                    AnalyticsEvent.created_at >= start_date,
                    AnalyticsEvent.created_at <= end_date,
                )
            )
            .group_by(AnalyticsEvent.event_type)
            .order_by(desc('count'))
        )
        result = await self.db.execute(events_by_type_query)
        events_by_type = {row[0]: row[1] for row in result.all()}

        # Calculate specific metrics
        total_views = events_by_type.get('view', 0)
        total_searches = events_by_type.get('search', 0)
        total_stars = events_by_type.get('star', 0)
        total_follows = events_by_type.get('follow', 0)

        # Get top repositories (by views/stars in analytics)
        top_repos_query = (
            select(
                AnalyticsEvent.entity_id,
                func.count(AnalyticsEvent.id).label('count')
            )
            .where(
                and_(
                    AnalyticsEvent.entity_type == 'repository',
                    AnalyticsEvent.event_type.in_(['view', 'star']),
                    AnalyticsEvent.created_at >= start_date,
                    AnalyticsEvent.created_at <= end_date,
                )
            )
            .group_by(AnalyticsEvent.entity_id)
            .order_by(desc('count'))
            .limit(10)
        )
        result = await self.db.execute(top_repos_query)
        top_repositories = [{"id": row[0], "count": row[1]} for row in result.all()]

        # Get top topics
        top_topics_query = (
            select(
                AnalyticsEvent.entity_id,
                func.count(AnalyticsEvent.id).label('count')
            )
            .where(
                and_(
                    AnalyticsEvent.entity_type == 'topic',
                    AnalyticsEvent.event_type.in_(['view', 'follow']),
                    AnalyticsEvent.created_at >= start_date,
                    AnalyticsEvent.created_at <= end_date,
                )
            )
            .group_by(AnalyticsEvent.entity_id)
            .order_by(desc('count'))
            .limit(10)
        )
        result = await self.db.execute(top_topics_query)
        top_topics = [{"id": row[0], "count": row[1]} for row in result.all()]

        # Get top searches
        top_searches_query = (
            select(
                AnalyticsEvent.metadata['query'].astext.label('query'),
                func.count(AnalyticsEvent.id).label('count')
            )
            .where(
                and_(
                    AnalyticsEvent.event_type == 'search',
                    AnalyticsEvent.created_at >= start_date,
                    AnalyticsEvent.created_at <= end_date,
                )
            )
            .group_by('query')
            .order_by(desc('count'))
            .limit(10)
        )
        result = await self.db.execute(top_searches_query)
        top_searches = [{"query": row[0], "count": row[1]} for row in result.all() if row[0]]

        # Calculate engagement rate (simplified)
        engagement_rate = (total_stars + total_follows) / max(total_views, 1) * 100

        return {
            "total_events": total_events,
            "total_users": total_users,
            "total_views": total_views,
            "total_searches": total_searches,
            "total_stars": total_stars,
            "total_follows": total_follows,
            "events_by_type": events_by_type,
            "events_by_date": [],  # Would require more complex query
            "top_repositories": top_repositories,
            "top_topics": top_topics,
            "top_searches": top_searches,
            "user_growth": [],  # Would require more complex query
            "engagement_rate": round(engagement_rate, 2),
        }

    async def get_user_analytics(
        self,
        user_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Get analytics for a specific user"""

        # Default to last 30 days
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        # Get total events for user
        events_query = select(func.count()).select_from(AnalyticsEvent).where(
            and_(
                AnalyticsEvent.user_id == user_id,
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at <= end_date,
            )
        )
        result = await self.db.execute(events_query)
        total_events = result.scalar() or 0

        # Get events by type
        events_by_type_query = (
            select(
                AnalyticsEvent.event_type,
                func.count(AnalyticsEvent.id).label('count')
            )
            .where(
                and_(
                    AnalyticsEvent.user_id == user_id,
                    AnalyticsEvent.created_at >= start_date,
                    AnalyticsEvent.created_at <= end_date,
                )
            )
            .group_by(AnalyticsEvent.event_type)
        )
        result = await self.db.execute(events_by_type_query)
        events_by_type = {row[0]: row[1] for row in result.all()}

        return {
            "user_id": str(user_id),
            "total_events": total_events,
            "total_views": events_by_type.get('view', 0),
            "total_searches": events_by_type.get('search', 0),
            "total_stars": events_by_type.get('star', 0),
            "total_follows": events_by_type.get('follow', 0),
            "favorite_languages": [],  # Would require joins
            "favorite_topics": [],  # Would require joins
            "activity_by_date": [],  # Would require more complex query
            "recent_repositories": [],  # Would require joins
            "engagement_score": 0.0,  # Calculated metric
        }

    async def get_repository_analytics(
        self,
        repository_id: UUID,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Get analytics for a specific repository"""

        # Default to last 30 days
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        # Get events for repository
        events_query = (
            select(
                AnalyticsEvent.event_type,
                func.count(AnalyticsEvent.id).label('count')
            )
            .where(
                and_(
                    AnalyticsEvent.entity_type == 'repository',
                    AnalyticsEvent.entity_id == str(repository_id),
                    AnalyticsEvent.created_at >= start_date,
                    AnalyticsEvent.created_at <= end_date,
                )
            )
            .group_by(AnalyticsEvent.event_type)
        )
        result = await self.db.execute(events_query)
        events_by_type = {row[0]: row[1] for row in result.all()}

        # Get unique visitors
        unique_visitors_query = select(
            func.count(func.distinct(AnalyticsEvent.user_id))
        ).where(
            and_(
                AnalyticsEvent.entity_type == 'repository',
                AnalyticsEvent.entity_id == str(repository_id),
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at <= end_date,
            )
        )
        result = await self.db.execute(unique_visitors_query)
        unique_visitors = result.scalar() or 0

        return {
            "repository_id": str(repository_id),
            "total_views": events_by_type.get('view', 0),
            "total_stars": events_by_type.get('star', 0),
            "unique_visitors": unique_visitors,
            "views_by_date": [],  # Would require more complex query
            "stars_by_date": [],  # Would require more complex query
            "referrer_sources": {},  # Would require aggregation
            "geographic_distribution": {},  # Would require IP geolocation
        }

    async def get_search_analytics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Get search analytics"""

        # Default to last 30 days
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)

        # Get total searches
        searches_query = select(func.count()).select_from(AnalyticsEvent).where(
            and_(
                AnalyticsEvent.event_type == 'search',
                AnalyticsEvent.created_at >= start_date,
                AnalyticsEvent.created_at <= end_date,
            )
        )
        result = await self.db.execute(searches_query)
        total_searches = result.scalar() or 0

        return {
            "total_searches": total_searches,
            "unique_queries": 0,  # Would require distinct count
            "top_queries": [],  # Would require grouping
            "searches_by_date": [],  # Would require date grouping
            "average_results": 0.0,  # Would require metadata analysis
            "zero_result_queries": [],  # Would require metadata analysis
        }
