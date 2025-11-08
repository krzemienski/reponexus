"""
Search service for unified search operations
"""

from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, desc
from uuid import UUID

from app.models.repository import Repository
from app.models.topic import Topic
from app.models.user import User


class SearchService:
    """Service for search operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_repositories(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20,
        sort: str = "stars",
        language: Optional[str] = None,
        topic: Optional[str] = None,
        min_stars: Optional[int] = None,
    ) -> Tuple[List[Repository], int, bool]:
        """Search repositories with filters"""

        # Build search query
        search_query = select(Repository)

        # Text search across multiple fields
        search_filter = or_(
            Repository.name.ilike(f"%{query}%"),
            Repository.name_with_owner.ilike(f"%{query}%"),
            Repository.description.ilike(f"%{query}%"),
            Repository.owner_login.ilike(f"%{query}%"),
        )
        search_query = search_query.where(search_filter)

        # Apply filters
        filters = [search_filter]
        if language:
            language_filter = Repository.primary_language == language
            filters.append(language_filter)
            search_query = search_query.where(language_filter)

        if topic:
            topic_filter = Repository.topics.contains([topic])
            filters.append(topic_filter)
            search_query = search_query.where(topic_filter)

        if min_stars is not None:
            stars_filter = Repository.stargazer_count >= min_stars
            filters.append(stars_filter)
            search_query = search_query.where(stars_filter)

        # Apply sorting
        if sort == "stars":
            search_query = search_query.order_by(desc(Repository.stargazer_count))
        elif sort == "forks":
            search_query = search_query.order_by(desc(Repository.fork_count))
        elif sort == "updated":
            search_query = search_query.order_by(desc(Repository.updated_at))
        elif sort == "created":
            search_query = search_query.order_by(desc(Repository.created_at))
        else:
            search_query = search_query.order_by(desc(Repository.stargazer_count))

        # Get total count
        count_query = select(func.count()).select_from(Repository).where(*filters)
        result = await self.db.execute(count_query)
        total = result.scalar() or 0

        # Apply pagination
        offset = (page - 1) * per_page
        search_query = search_query.offset(offset).limit(per_page)

        # Execute query
        result = await self.db.execute(search_query)
        repositories = list(result.scalars().all())

        # Incomplete results flag (for large result sets)
        incomplete_results = total > 1000

        return repositories, total, incomplete_results

    async def search_topics(
        self,
        query: str,
        limit: int = 20,
    ) -> Tuple[List[Topic], int]:
        """Search topics"""

        # Build search query
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

        # Get total count
        count_query = select(func.count()).select_from(Topic).where(search_filter)
        result = await self.db.execute(count_query)
        total = result.scalar() or 0

        # Execute query
        result = await self.db.execute(search_query)
        topics = list(result.scalars().all())

        return topics, total

    async def search_users(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[User], int]:
        """Search users"""

        # Build search query
        search_filter = or_(
            User.login.ilike(f"%{query}%"),
            User.name.ilike(f"%{query}%"),
            User.bio.ilike(f"%{query}%"),
            User.company.ilike(f"%{query}%"),
        )

        search_query = (
            select(User)
            .where(search_filter)
            .order_by(desc(User.followers))
        )

        # Get total count
        count_query = select(func.count()).select_from(User).where(search_filter)
        result = await self.db.execute(count_query)
        total = result.scalar() or 0

        # Apply pagination
        offset = (page - 1) * per_page
        search_query = search_query.offset(offset).limit(per_page)

        # Execute query
        result = await self.db.execute(search_query)
        users = list(result.scalars().all())

        return users, total

    async def search_all(
        self,
        query: str,
        limit: int = 5,
    ) -> Dict[str, Any]:
        """Search across all entities (repositories, topics, users)"""

        # Search repositories
        repos_query = (
            select(Repository)
            .where(
                or_(
                    Repository.name.ilike(f"%{query}%"),
                    Repository.description.ilike(f"%{query}%"),
                )
            )
            .order_by(desc(Repository.stargazer_count))
            .limit(limit)
        )
        result = await self.db.execute(repos_query)
        repositories = list(result.scalars().all())

        # Search topics
        topics_query = (
            select(Topic)
            .where(
                or_(
                    Topic.name.ilike(f"%{query}%"),
                    Topic.display_name.ilike(f"%{query}%"),
                )
            )
            .order_by(desc(Topic.repository_count))
            .limit(limit)
        )
        result = await self.db.execute(topics_query)
        topics = list(result.scalars().all())

        # Search users
        users_query = (
            select(User)
            .where(
                or_(
                    User.login.ilike(f"%{query}%"),
                    User.name.ilike(f"%{query}%"),
                )
            )
            .order_by(desc(User.followers))
            .limit(limit)
        )
        result = await self.db.execute(users_query)
        users = list(result.scalars().all())

        return {
            "repositories": repositories,
            "topics": topics,
            "users": users,
            "query": query,
        }

    async def get_popular_searches(self, limit: int = 10) -> List[str]:
        """Get popular search queries (placeholder for analytics integration)"""
        # This would typically query analytics_events for popular searches
        # For now, return empty list
        return []

    async def get_trending_searches(self, limit: int = 10) -> List[str]:
        """Get trending search queries (placeholder for analytics integration)"""
        # This would typically query analytics_events for trending searches
        # For now, return empty list
        return []

    async def get_search_suggestions(
        self, user_id: Optional[UUID] = None, limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get search suggestions from user's search history"""
        from app.models.search_history import SearchHistory

        if not user_id:
            return []

        # Get recent unique searches for the user
        query = (
            select(SearchHistory.query, SearchHistory.result_type, func.count().label('count'))
            .where(SearchHistory.user_id == user_id)
            .group_by(SearchHistory.query, SearchHistory.result_type)
            .order_by(desc(func.max(SearchHistory.created_at)))
            .limit(limit)
        )

        result = await self.db.execute(query)
        suggestions = []

        for row in result:
            suggestions.append({
                "query": row.query,
                "type": row.result_type,
                "count": row.count,
            })

        return suggestions

    async def save_search_history(
        self,
        query: str,
        result_type: str,
        result_count: int,
        user_id: Optional[UUID] = None,
    ) -> None:
        """Save search query to history"""
        from app.models.search_history import SearchHistory, SearchResultType

        # Convert string to enum
        try:
            result_type_enum = SearchResultType(result_type)
        except ValueError:
            # Invalid result type, skip saving
            return

        search_entry = SearchHistory(
            user_id=user_id,
            query=query,
            result_type=result_type_enum,
            result_count=result_count,
        )

        self.db.add(search_entry)
        await self.db.commit()
