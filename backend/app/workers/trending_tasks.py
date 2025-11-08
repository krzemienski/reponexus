"""
Trending Tasks - Celery tasks for calculating topic-centric trending scores
Implements custom trending algorithm with weighted scoring
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.workers.celery import celery_app
from app.core.db import AsyncSessionLocal
from app.models.repository import Repository
from app.models.topic import Topic
from app.services.trending_service import TrendingService
from app.services.github_activity_service import GitHubActivityService
from app.services.cache_service import get_cache_service
from sqlalchemy import select, and_

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async functions in Celery tasks"""
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(coro)


@celery_app.task(name="calculate_topic_trending", bind=True, max_retries=3)
def calculate_topic_trending(self, topic_id: str, time_window: str = "daily"):
    """
    Calculate trending scores for all repositories in a specific topic

    Args:
        topic_id: Topic UUID as string
        time_window: 'daily', 'weekly', or 'monthly'
    """
    logger.info(f"Calculating trending scores for topic {topic_id} (window: {time_window})")

    try:
        return run_async(_calculate_topic_trending_async(topic_id, time_window))
    except Exception as e:
        logger.error(f"Error calculating topic trending: {e}")
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


async def _calculate_topic_trending_async(topic_id: str, time_window: str) -> Dict[str, Any]:
    """Async implementation of topic trending calculation"""
    try:
        from uuid import UUID

        topic_uuid = UUID(topic_id)
        time_window_days = {'daily': 7, 'weekly': 30, 'monthly': 90}.get(time_window, 7)

        async with AsyncSessionLocal() as session:
            # Get topic
            stmt = select(Topic).where(Topic.id == topic_uuid)
            result = await session.execute(stmt)
            topic = result.scalar_one_or_none()

            if not topic:
                logger.warning(f"Topic {topic_id} not found")
                return {
                    "success": False,
                    "error": "Topic not found"
                }

            # Get repositories with this topic
            stmt = select(Repository).where(
                Repository.topics.contains([topic.name])
            )
            result = await session.execute(stmt)
            repositories = result.scalars().all()

            logger.info(f"Found {len(repositories)} repositories for topic {topic.name}")

            # Initialize services
            trending_service = TrendingService(session)
            activity_service = GitHubActivityService(session)

            calculated_count = 0

            for repo in repositories:
                try:
                    # Fetch activity data
                    activity_data = await activity_service.fetch_repo_activity(
                        repo.id,
                        days=time_window_days
                    )

                    # Calculate trending score
                    trending_score = await trending_service.calculate_trending_score(
                        repo_id=repo.id,
                        topic_id=topic_uuid,
                        time_window=time_window,
                        activity_data=activity_data
                    )

                    if trending_score:
                        calculated_count += 1
                        logger.debug(
                            f"Calculated trending score for {repo.name_with_owner}: "
                            f"{trending_score.trending_score:.2f}"
                        )

                except Exception as e:
                    logger.error(f"Error calculating score for {repo.name_with_owner}: {e}")
                    continue

            logger.info(
                f"Calculated {calculated_count} trending scores for topic {topic.name} "
                f"(window: {time_window})"
            )

            return {
                "success": True,
                "topic_id": topic_id,
                "topic_name": topic.name,
                "time_window": time_window,
                "repositories_found": len(repositories),
                "scores_calculated": calculated_count
            }

    except Exception as e:
        logger.error(f"Error in _calculate_topic_trending_async: {e}")
        raise


@celery_app.task(name="calculate_all_trending", bind=True)
def calculate_all_trending(self, time_window: str = "daily", limit: Optional[int] = None):
    """
    Calculate trending scores for all topics

    Args:
        time_window: 'daily', 'weekly', or 'monthly'
        limit: Optional limit on number of topics to process
    """
    logger.info(f"Calculating trending scores for all topics (window: {time_window})")

    try:
        return run_async(_calculate_all_trending_async(time_window, limit))
    except Exception as e:
        logger.error(f"Error in calculate_all_trending: {e}")
        raise


async def _calculate_all_trending_async(
    time_window: str,
    limit: Optional[int] = None
) -> Dict[str, Any]:
    """Async implementation of calculate all trending"""
    try:
        async with AsyncSessionLocal() as session:
            # Get all topics
            stmt = select(Topic).order_by(Topic.repository_count.desc())

            if limit:
                stmt = stmt.limit(limit)

            result = await session.execute(stmt)
            topics = result.scalars().all()

            logger.info(f"Processing {len(topics)} topics")

            tasks_queued = 0

            # Queue trending calculation for each topic
            for topic in topics:
                try:
                    calculate_topic_trending.delay(str(topic.id), time_window)
                    tasks_queued += 1
                except Exception as e:
                    logger.error(f"Error queueing trending calculation for topic {topic.name}: {e}")

            logger.info(f"Queued {tasks_queued} topic trending calculation tasks")

            return {
                "success": True,
                "time_window": time_window,
                "topics_found": len(topics),
                "tasks_queued": tasks_queued
            }

    except Exception as e:
        logger.error(f"Error in _calculate_all_trending_async: {e}")
        raise


@celery_app.task(name="update_trending_cache_for_topics", bind=True)
def update_trending_cache_for_topics(self, time_window: str = "daily"):
    """
    Update Redis cache with trending repositories for all topics

    Args:
        time_window: 'daily', 'weekly', or 'monthly'
    """
    logger.info(f"Updating trending cache for topics (window: {time_window})")

    try:
        return run_async(_update_trending_cache_async(time_window))
    except Exception as e:
        logger.error(f"Error updating trending cache: {e}")
        raise


async def _update_trending_cache_async(time_window: str) -> Dict[str, Any]:
    """Async implementation of trending cache update"""
    try:
        cache = get_cache_service()

        async with AsyncSessionLocal() as session:
            # Get all topics
            stmt = select(Topic).order_by(Topic.repository_count.desc())
            result = await session.execute(stmt)
            topics = result.scalars().all()

            trending_service = TrendingService(session)
            cached_count = 0

            for topic in topics:
                try:
                    # Get trending repos for this topic
                    repos, total = await trending_service.get_trending_repos_for_topic(
                        topic_id=topic.id,
                        time_window=time_window,
                        limit=50
                    )

                    if repos:
                        # Prepare cache data
                        cache_key = f"trending:{topic.id}:{time_window}"

                        repo_ids = [str(repo.id) for repo in repos]

                        # Cache with appropriate TTL
                        ttl_map = {'daily': 900, 'weekly': 3600, 'monthly': 7200}
                        ttl = ttl_map.get(time_window, 900)

                        await cache.set(cache_key, repo_ids, ttl=ttl)

                        cached_count += 1
                        logger.debug(f"Cached {len(repo_ids)} trending repos for topic {topic.name}")

                except Exception as e:
                    logger.error(f"Error caching trending for topic {topic.name}: {e}")
                    continue

            logger.info(f"Updated trending cache for {cached_count} topics")

            return {
                "success": True,
                "time_window": time_window,
                "topics_processed": len(topics),
                "topics_cached": cached_count
            }

    except Exception as e:
        logger.error(f"Error in _update_trending_cache_async: {e}")
        raise


@celery_app.task(name="cleanup_trending_scores", bind=True)
def cleanup_trending_scores(self, days: int = 7):
    """
    Cleanup old trending scores

    Args:
        days: Delete scores older than this many days
    """
    logger.info(f"Cleaning up trending scores older than {days} days")

    try:
        return run_async(_cleanup_trending_scores_async(days))
    except Exception as e:
        logger.error(f"Error cleaning up trending scores: {e}")
        raise


async def _cleanup_trending_scores_async(days: int) -> Dict[str, Any]:
    """Async implementation of trending scores cleanup"""
    try:
        async with AsyncSessionLocal() as session:
            trending_service = TrendingService(session)

            deleted_count = await trending_service.cleanup_old_scores(days)

            logger.info(f"Deleted {deleted_count} old trending scores")

            return {
                "success": True,
                "deleted_count": deleted_count
            }

    except Exception as e:
        logger.error(f"Error in _cleanup_trending_scores_async: {e}")
        raise


@celery_app.task(name="refresh_trending_for_popular_topics", bind=True)
def refresh_trending_for_popular_topics(self, time_window: str = "daily", top_n: int = 20):
    """
    Refresh trending scores for the most popular topics only

    Args:
        time_window: 'daily', 'weekly', or 'monthly'
        top_n: Number of top topics to process
    """
    logger.info(f"Refreshing trending for top {top_n} topics (window: {time_window})")

    try:
        return run_async(_refresh_trending_popular_async(time_window, top_n))
    except Exception as e:
        logger.error(f"Error refreshing trending for popular topics: {e}")
        raise


async def _refresh_trending_popular_async(time_window: str, top_n: int) -> Dict[str, Any]:
    """Async implementation of popular topics trending refresh"""
    try:
        async with AsyncSessionLocal() as session:
            # Get top N topics by repository count and follower count
            stmt = (
                select(Topic)
                .order_by(Topic.repository_count.desc())
                .limit(top_n)
            )
            result = await session.execute(stmt)
            topics = result.scalars().all()

            tasks_queued = 0

            for topic in topics:
                try:
                    calculate_topic_trending.delay(str(topic.id), time_window)
                    tasks_queued += 1
                except Exception as e:
                    logger.error(f"Error queueing trending for topic {topic.name}: {e}")

            logger.info(f"Queued {tasks_queued} trending refresh tasks for popular topics")

            return {
                "success": True,
                "time_window": time_window,
                "topics_processed": len(topics),
                "tasks_queued": tasks_queued
            }

    except Exception as e:
        logger.error(f"Error in _refresh_trending_popular_async: {e}")
        raise
