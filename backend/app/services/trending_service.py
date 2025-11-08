"""
Trending Service - Calculates trending scores for repositories within topics
Uses weighted scoring based on star growth, activity, community engagement, recency, and quality
"""
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy import select, delete, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.models.repository import Repository
from app.models.topic import Topic
from app.models.trending_score import TrendingScore
from app.services.cache_service import get_cache_service

logger = logging.getLogger(__name__)

# Scoring weights (must sum to 1.0)
WEIGHTS = {
    'star_growth': 0.35,      # 35% weight
    'activity_growth': 0.25,  # 25% weight
    'community_engagement': 0.20,  # 20% weight
    'recency': 0.15,          # 15% weight
    'quality': 0.05           # 5% weight
}

# Time window configurations (in days)
TIME_WINDOWS = {
    'daily': 7,
    'weekly': 30,
    'monthly': 90
}


class TrendingAlgorithm:
    """
    Implements the custom trending algorithm for repositories within topics
    """

    def __init__(self, session: AsyncSession):
        self.session = session
        self.cache = get_cache_service()

    @staticmethod
    def clamp(value: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
        """Clamp value between min and max"""
        return max(min_val, min(value, max_val))

    @staticmethod
    def normalize(value: float, max_value: float = 100.0) -> float:
        """Normalize value to 0-100 scale"""
        if max_value == 0:
            return 0.0
        return min((value / max_value) * 100.0, 100.0)

    async def calculate_star_growth(
        self,
        repo: Repository,
        activity_data: Dict[str, Any],
        time_window: str
    ) -> float:
        """
        Calculate star growth score (0-100)
        Based on: stars gained in time window / total stars

        Args:
            repo: Repository model
            activity_data: GitHub activity data with star history
            time_window: 'daily', 'weekly', or 'monthly'

        Returns:
            Star growth score (0-100)
        """
        try:
            total_stars = max(repo.stargazer_count, 1)
            stars_gained = activity_data.get('stars_gained', 0)

            # Calculate growth rate as percentage
            growth_rate = (stars_gained / total_stars) * 100

            # Normalize to 0-100 (assume 10% growth is max for normalization)
            normalized_score = min(growth_rate * 10, 100.0)

            return normalized_score
        except Exception as e:
            logger.error(f"Error calculating star growth for {repo.name_with_owner}: {e}")
            return 0.0

    async def calculate_activity_score(
        self,
        repo: Repository,
        activity_data: Dict[str, Any],
        time_window: str
    ) -> float:
        """
        Calculate activity score (0-100)
        Based on: recent commits and PRs merged

        Args:
            repo: Repository model
            activity_data: GitHub activity data
            time_window: 'daily', 'weekly', or 'monthly'

        Returns:
            Activity score (0-100)
        """
        try:
            commits = activity_data.get('commits', 0)
            prs_merged = activity_data.get('prs_merged', 0)

            # Weighted activity score
            activity = (commits * 1.5) + (prs_merged * 2.0)

            # Normalize based on time window
            # Daily: 10 commits/PRs = 100, Weekly: 30 = 100, Monthly: 100 = 100
            max_activity = {'daily': 10, 'weekly': 30, 'monthly': 100}.get(time_window, 30)

            normalized_score = self.normalize(activity, max_activity)

            return normalized_score
        except Exception as e:
            logger.error(f"Error calculating activity score for {repo.name_with_owner}: {e}")
            return 0.0

    async def calculate_community_score(
        self,
        repo: Repository,
        activity_data: Dict[str, Any],
        time_window: str
    ) -> float:
        """
        Calculate community engagement score (0-100)
        Based on: issues closed, PR merge rate, contributor growth

        Args:
            repo: Repository model
            activity_data: GitHub activity data
            time_window: 'daily', 'weekly', or 'monthly'

        Returns:
            Community score (0-100)
        """
        try:
            issues_closed = activity_data.get('issues_closed', 0)
            new_contributors = activity_data.get('new_contributors', 0)
            pr_merge_rate = activity_data.get('pr_merge_rate', 0.0)  # 0.0 to 1.0

            # Weighted community score
            community = (
                issues_closed +
                (new_contributors * 2) +
                (pr_merge_rate * 10)  # PR merge rate contributes up to 10 points
            )

            # Normalize based on time window
            max_community = {'daily': 15, 'weekly': 40, 'monthly': 120}.get(time_window, 40)

            normalized_score = self.normalize(community, max_community)

            return normalized_score
        except Exception as e:
            logger.error(f"Error calculating community score for {repo.name_with_owner}: {e}")
            return 0.0

    async def calculate_recency_score(
        self,
        repo: Repository,
        time_window: str
    ) -> float:
        """
        Calculate recency score (0-100)
        Based on: days since last commit (inverse - more recent = higher)

        Args:
            repo: Repository model
            time_window: 'daily', 'weekly', or 'monthly'

        Returns:
            Recency score (0-100)
        """
        try:
            if not repo.pushed_at:
                return 0.0

            days_since_commit = (datetime.utcnow() - repo.pushed_at).days
            window_days = TIME_WINDOWS.get(time_window, 30)

            # Inverse score: recent commits get higher scores
            recency_score = 100 - ((days_since_commit / window_days) * 100)

            return max(recency_score, 0.0)
        except Exception as e:
            logger.error(f"Error calculating recency score for {repo.name_with_owner}: {e}")
            return 0.0

    async def calculate_quality_score(self, repo: Repository) -> float:
        """
        Calculate quality score (0-100)
        Based on: presence of README, LICENSE, description, topics

        Args:
            repo: Repository model

        Returns:
            Quality score (0-100)
        """
        try:
            score = 0.0

            # Note: We assume README and LICENSE existence based on star count
            # In production, these would be fetched from GitHub API
            if repo.stargazer_count > 100:
                score += 20  # Has README (implied by popularity)
                score += 20  # Has LICENSE (implied by popularity)

            if repo.description:
                score += 20

            if repo.topics and len(repo.topics) >= 3:
                score += 20

            if repo.stargazer_count > 100:
                score += 20

            return score
        except Exception as e:
            logger.error(f"Error calculating quality score for {repo.name_with_owner}: {e}")
            return 0.0

    async def calculate_trending_score(
        self,
        repo_id: UUID,
        topic_id: UUID,
        time_window: str,
        activity_data: Optional[Dict[str, Any]] = None
    ) -> Optional[TrendingScore]:
        """
        Calculate comprehensive trending score for a repository within a topic

        Args:
            repo_id: Repository UUID
            topic_id: Topic UUID
            time_window: 'daily', 'weekly', or 'monthly'
            activity_data: Optional pre-fetched activity data

        Returns:
            TrendingScore model or None if calculation failed
        """
        try:
            # Fetch repository
            stmt = select(Repository).where(Repository.id == repo_id)
            result = await self.session.execute(stmt)
            repo = result.scalar_one_or_none()

            if not repo:
                logger.warning(f"Repository {repo_id} not found")
                return None

            # Use provided activity data or default to zeros
            if activity_data is None:
                activity_data = {
                    'stars_gained': 0,
                    'commits': 0,
                    'prs_merged': 0,
                    'issues_closed': 0,
                    'new_contributors': 0,
                    'pr_merge_rate': 0.0
                }

            # Calculate component scores
            star_growth_score = await self.calculate_star_growth(repo, activity_data, time_window)
            activity_score = await self.calculate_activity_score(repo, activity_data, time_window)
            community_score = await self.calculate_community_score(repo, activity_data, time_window)
            recency_score = await self.calculate_recency_score(repo, time_window)
            quality_score = await self.calculate_quality_score(repo)

            # Calculate weighted final score
            final_score = (
                (star_growth_score * WEIGHTS['star_growth']) +
                (activity_score * WEIGHTS['activity_growth']) +
                (community_score * WEIGHTS['community_engagement']) +
                (recency_score * WEIGHTS['recency']) +
                (quality_score * WEIGHTS['quality'])
            )

            # Clamp to 0-100
            final_score = self.clamp(final_score, 0.0, 100.0)

            # Check if trending score already exists
            stmt = select(TrendingScore).where(
                and_(
                    TrendingScore.repository_id == repo_id,
                    TrendingScore.topic_id == topic_id,
                    TrendingScore.time_window == time_window
                )
            )
            result = await self.session.execute(stmt)
            existing_score = result.scalar_one_or_none()

            if existing_score:
                # Update existing score
                existing_score.trending_score = final_score
                existing_score.star_growth_rate = star_growth_score
                existing_score.activity_score = activity_score
                existing_score.community_score = community_score
                existing_score.recency_score = recency_score
                existing_score.quality_score = quality_score
                existing_score.calculated_at = datetime.utcnow()

                trending_score_obj = existing_score
            else:
                # Create new score
                trending_score_obj = TrendingScore(
                    repository_id=repo_id,
                    topic_id=topic_id,
                    trending_score=final_score,
                    star_growth_rate=star_growth_score,
                    activity_score=activity_score,
                    community_score=community_score,
                    recency_score=recency_score,
                    quality_score=quality_score,
                    time_window=time_window,
                    calculated_at=datetime.utcnow()
                )
                self.session.add(trending_score_obj)

            await self.session.commit()
            await self.session.refresh(trending_score_obj)

            logger.info(
                f"Calculated trending score for {repo.name_with_owner} in topic {topic_id}: "
                f"{final_score:.2f} (window: {time_window})"
            )

            return trending_score_obj

        except Exception as e:
            logger.error(f"Error calculating trending score: {e}")
            await self.session.rollback()
            return None


class TrendingService:
    """
    Service for managing trending scores and retrieving trending repositories
    """

    def __init__(self, session: AsyncSession):
        self.session = session
        self.algorithm = TrendingAlgorithm(session)
        self.cache = get_cache_service()

    async def calculate_trending_score(
        self,
        repo_id: UUID,
        topic_id: UUID,
        time_window: str = 'daily',
        activity_data: Optional[Dict[str, Any]] = None
    ) -> Optional[TrendingScore]:
        """
        Calculate trending score for a repository within a topic

        Args:
            repo_id: Repository UUID
            topic_id: Topic UUID
            time_window: 'daily', 'weekly', or 'monthly'
            activity_data: Optional pre-fetched activity data

        Returns:
            TrendingScore model or None
        """
        return await self.algorithm.calculate_trending_score(
            repo_id, topic_id, time_window, activity_data
        )

    async def get_trending_repos_for_topic(
        self,
        topic_id: UUID,
        time_window: str = 'daily',
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[List[Repository], int]:
        """
        Get trending repositories for a specific topic

        Args:
            topic_id: Topic UUID
            time_window: 'daily', 'weekly', or 'monthly'
            limit: Maximum number of results
            offset: Offset for pagination

        Returns:
            Tuple of (repositories list, total count)
        """
        try:
            # Query trending scores with repository join
            stmt = (
                select(Repository, TrendingScore)
                .join(TrendingScore, Repository.id == TrendingScore.repository_id)
                .where(
                    and_(
                        TrendingScore.topic_id == topic_id,
                        TrendingScore.time_window == time_window
                    )
                )
                .order_by(TrendingScore.trending_score.desc())
                .limit(limit)
                .offset(offset)
            )

            result = await self.session.execute(stmt)
            rows = result.all()

            repositories = [row[0] for row in rows]

            # Get total count
            count_stmt = (
                select(func.count(TrendingScore.id))
                .where(
                    and_(
                        TrendingScore.topic_id == topic_id,
                        TrendingScore.time_window == time_window
                    )
                )
            )
            count_result = await self.session.execute(count_stmt)
            total = count_result.scalar() or 0

            return repositories, total

        except Exception as e:
            logger.error(f"Error getting trending repos for topic {topic_id}: {e}")
            return [], 0

    async def get_trending_repos_for_user_topics(
        self,
        user_id: UUID,
        time_window: str = 'daily',
        topic_filter: Optional[UUID] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[List[Repository], int]:
        """
        Get trending repositories from all topics a user follows

        Args:
            user_id: User UUID
            time_window: 'daily', 'weekly', or 'monthly'
            topic_filter: Optional specific topic UUID to filter by
            limit: Maximum number of results
            offset: Offset for pagination

        Returns:
            Tuple of (repositories list, total count)
        """
        try:
            from app.models.topic import UserTopic

            # Get user's followed topics
            if topic_filter:
                topic_ids = [topic_filter]
            else:
                stmt = select(UserTopic.topic_id).where(
                    and_(
                        UserTopic.user_id == user_id,
                        UserTopic.is_following == True
                    )
                )
                result = await self.session.execute(stmt)
                topic_ids = [row[0] for row in result.all()]

            if not topic_ids:
                return [], 0

            # Query trending scores from followed topics
            stmt = (
                select(Repository, TrendingScore)
                .join(TrendingScore, Repository.id == TrendingScore.repository_id)
                .where(
                    and_(
                        TrendingScore.topic_id.in_(topic_ids),
                        TrendingScore.time_window == time_window
                    )
                )
                .order_by(TrendingScore.trending_score.desc())
                .limit(limit)
                .offset(offset)
            )

            result = await self.session.execute(stmt)
            rows = result.all()

            repositories = [row[0] for row in rows]

            # Get total count
            count_stmt = (
                select(func.count(TrendingScore.id))
                .where(
                    and_(
                        TrendingScore.topic_id.in_(topic_ids),
                        TrendingScore.time_window == time_window
                    )
                )
            )
            count_result = await self.session.execute(count_stmt)
            total = count_result.scalar() or 0

            return repositories, total

        except Exception as e:
            logger.error(f"Error getting trending repos for user {user_id}: {e}")
            return [], 0

    async def cleanup_old_scores(self, days: int = 7) -> int:
        """
        Remove trending scores older than specified days

        Args:
            days: Number of days to keep scores for

        Returns:
            Number of scores deleted
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)

            stmt = delete(TrendingScore).where(
                TrendingScore.calculated_at < cutoff_date
            )

            result = await self.session.execute(stmt)
            await self.session.commit()

            deleted_count = result.rowcount
            logger.info(f"Deleted {deleted_count} old trending scores")

            return deleted_count

        except Exception as e:
            logger.error(f"Error cleaning up old trending scores: {e}")
            await self.session.rollback()
            return 0
