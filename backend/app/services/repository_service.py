"""
Repository service for business logic
"""

from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, desc, asc
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from uuid import UUID

from app.models.repository import Repository
from app.models.starred_repository import StarredRepository
from app.models.user import User
from app.schemas.repository import RepositoryCreate, RepositoryUpdate
from app.services.cache_service import CacheService
from app.services.github_service import GitHubService


class RepositoryService:
    """Service for repository operations"""

    def __init__(self, db: AsyncSession, cache: Optional[CacheService] = None):
        self.db = db
        self.cache = cache or CacheService()

    async def get_repositories(
        self,
        page: int = 1,
        per_page: int = 20,
        sort: str = "stars",
        language: Optional[str] = None,
        topic: Optional[str] = None,
        min_stars: Optional[int] = None,
        is_fork: Optional[bool] = None,
        is_archived: Optional[bool] = None,
        user_id: Optional[UUID] = None,
    ) -> Tuple[List[Repository], int]:
        """Get repositories with filters and pagination"""

        # Build query
        query = select(Repository)

        # Apply filters
        filters = []
        if language:
            filters.append(Repository.primary_language == language)
        if topic:
            filters.append(Repository.topics.contains([topic]))
        if min_stars is not None:
            filters.append(Repository.stargazer_count >= min_stars)
        if is_fork is not None:
            filters.append(Repository.is_fork == is_fork)
        if is_archived is not None:
            filters.append(Repository.is_archived == is_archived)

        if filters:
            query = query.where(and_(*filters))

        # Apply sorting
        if sort == "stars":
            query = query.order_by(desc(Repository.stargazer_count))
        elif sort == "updated":
            query = query.order_by(desc(Repository.updated_at))
        elif sort == "created":
            query = query.order_by(desc(Repository.created_at))
        else:
            query = query.order_by(desc(Repository.stargazer_count))

        # Get total count
        count_query = select(func.count()).select_from(Repository)
        if filters:
            count_query = count_query.where(and_(*filters))
        result = await self.db.execute(count_query)
        total = result.scalar() or 0

        # Apply pagination
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)

        # Execute query
        result = await self.db.execute(query)
        repositories = result.scalars().all()

        # Add is_starred flag if user_id provided
        if user_id:
            repositories = await self._add_starred_flag(repositories, user_id)

        return list(repositories), total

    async def get_repository(
        self,
        repository_id: UUID,
        user_id: Optional[UUID] = None
    ) -> Optional[Repository]:
        """Get repository by ID"""
        query = select(Repository).where(Repository.id == repository_id)
        result = await self.db.execute(query)
        repository = result.scalar_one_or_none()

        if repository and user_id:
            repos_with_flag = await self._add_starred_flag([repository], user_id)
            return repos_with_flag[0] if repos_with_flag else repository

        return repository

    async def get_repository_by_github_id(
        self, github_id: str
    ) -> Optional[Repository]:
        """Get repository by GitHub ID"""
        query = select(Repository).where(Repository.github_id == github_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_repository(
        self, repository_data: RepositoryCreate
    ) -> Repository:
        """Create a new repository"""
        repository = Repository(**repository_data.model_dump())
        self.db.add(repository)
        await self.db.commit()
        await self.db.refresh(repository)
        return repository

    async def update_repository(
        self, repository_id: UUID, repository_data: RepositoryUpdate
    ) -> Optional[Repository]:
        """Update repository"""
        repository = await self.get_repository(repository_id)
        if not repository:
            return None

        update_data = repository_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(repository, field, value)

        await self.db.commit()
        await self.db.refresh(repository)
        return repository

    async def star_repository(
        self, repository_id: UUID, user_id: UUID
    ) -> Tuple[Repository, StarredRepository]:
        """Star a repository"""
        # Check if already starred
        query = select(StarredRepository).where(
            and_(
                StarredRepository.user_id == user_id,
                StarredRepository.repository_id == repository_id
            )
        )
        result = await self.db.execute(query)
        existing = result.scalar_one_or_none()

        if existing:
            repository = await self.get_repository(repository_id)
            return repository, existing

        # Create starred relationship
        starred = StarredRepository(
            user_id=user_id,
            repository_id=repository_id,
            starred_at=datetime.utcnow()
        )
        self.db.add(starred)

        # Increment star count
        repository = await self.get_repository(repository_id)
        if repository:
            repository.stargazer_count += 1

        await self.db.commit()
        await self.db.refresh(starred)
        if repository:
            await self.db.refresh(repository)

        return repository, starred

    async def unstar_repository(
        self, repository_id: UUID, user_id: UUID
    ) -> Optional[Repository]:
        """Unstar a repository"""
        # Find starred relationship
        query = select(StarredRepository).where(
            and_(
                StarredRepository.user_id == user_id,
                StarredRepository.repository_id == repository_id
            )
        )
        result = await self.db.execute(query)
        starred = result.scalar_one_or_none()

        if not starred:
            return await self.get_repository(repository_id)

        # Delete starred relationship
        await self.db.delete(starred)

        # Decrement star count
        repository = await self.get_repository(repository_id)
        if repository and repository.stargazer_count > 0:
            repository.stargazer_count -= 1

        await self.db.commit()
        if repository:
            await self.db.refresh(repository)

        return repository

    async def get_trending_repositories(
        self,
        period: str = "daily",
        language: Optional[str] = None,
        limit: int = 25
    ) -> List[Repository]:
        """Get trending repositories"""
        # Try cache first
        cache_key = f"trending:{period}:{language or 'all'}"
        cached = await self.cache.get(cache_key)
        if cached:
            return cached

        # Calculate date threshold
        if period == "daily":
            threshold = datetime.utcnow() - timedelta(days=1)
        elif period == "weekly":
            threshold = datetime.utcnow() - timedelta(weeks=1)
        elif period == "monthly":
            threshold = datetime.utcnow() - timedelta(days=30)
        else:
            threshold = datetime.utcnow() - timedelta(days=1)

        # Build query
        query = select(Repository).where(
            Repository.updated_at >= threshold
        )

        if language:
            query = query.where(Repository.primary_language == language)

        query = query.order_by(
            desc(Repository.trending_score),
            desc(Repository.stargazer_count)
        ).limit(limit)

        result = await self.db.execute(query)
        repositories = list(result.scalars().all())

        # Cache results
        await self.cache.set(cache_key, repositories, ttl=3600)  # 1 hour cache

        return repositories

    async def get_readme(
        self, repository_id: UUID, github_service: GitHubService
    ) -> Optional[str]:
        """Get repository README"""
        repository = await self.get_repository(repository_id)
        if not repository:
            return None

        # Try cache first
        cache_key = f"readme:{repository.github_id}"
        cached = await self.cache.get(cache_key)
        if cached:
            return cached

        # Fetch from GitHub
        readme_content = await github_service.get_repository_readme(
            repository.owner_login, repository.name
        )

        if readme_content:
            # Cache for 1 hour
            await self.cache.set(cache_key, readme_content, ttl=3600)

        return readme_content

    async def search_repositories(
        self,
        query: str,
        page: int = 1,
        per_page: int = 20,
        sort: str = "stars",
        language: Optional[str] = None,
        topic: Optional[str] = None,
    ) -> Tuple[List[Repository], int]:
        """Search repositories"""
        # Build search query
        search_query = select(Repository)

        # Text search
        search_filter = or_(
            Repository.name.ilike(f"%{query}%"),
            Repository.description.ilike(f"%{query}%"),
            Repository.owner_login.ilike(f"%{query}%"),
        )
        search_query = search_query.where(search_filter)

        # Apply filters
        if language:
            search_query = search_query.where(Repository.primary_language == language)
        if topic:
            search_query = search_query.where(Repository.topics.contains([topic]))

        # Apply sorting
        if sort == "stars":
            search_query = search_query.order_by(desc(Repository.stargazer_count))
        elif sort == "forks":
            search_query = search_query.order_by(desc(Repository.fork_count))
        elif sort == "updated":
            search_query = search_query.order_by(desc(Repository.updated_at))

        # Get total count
        count_query = select(func.count()).select_from(Repository).where(search_filter)
        if language:
            count_query = count_query.where(Repository.primary_language == language)
        if topic:
            count_query = count_query.where(Repository.topics.contains([topic]))

        result = await self.db.execute(count_query)
        total = result.scalar() or 0

        # Apply pagination
        offset = (page - 1) * per_page
        search_query = search_query.offset(offset).limit(per_page)

        result = await self.db.execute(search_query)
        repositories = list(result.scalars().all())

        return repositories, total

    async def _add_starred_flag(
        self, repositories: List[Repository], user_id: UUID
    ) -> List[Repository]:
        """Add is_starred flag to repositories"""
        if not repositories:
            return []

        repo_ids = [repo.id for repo in repositories]
        query = select(StarredRepository.repository_id).where(
            and_(
                StarredRepository.user_id == user_id,
                StarredRepository.repository_id.in_(repo_ids)
            )
        )
        result = await self.db.execute(query)
        starred_ids = set(result.scalars().all())

        for repo in repositories:
            repo.is_starred = repo.id in starred_ids

        return repositories
