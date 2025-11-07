"""
Topic Sync Workers
Celery tasks for syncing topic data and repositories
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert

from app.workers.celery import celery_app
from app.services.github_service import get_github_service
from app.services.github_graphql import get_github_graphql_client
from app.services.cache_service import get_cache_service
from app.core.db import async_session_maker
from app.models.topic import Topic
from app.models.repository import Repository

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async functions in Celery tasks"""
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(coro)


@celery_app.task(name="discover_topics", bind=True, max_retries=3)
def discover_topics(self):
    """
    Discover and sync popular GitHub topics
    """
    logger.info("Discovering GitHub topics")

    try:
        return run_async(_discover_topics_async())
    except Exception as e:
        logger.error(f"Error discovering topics: {e}")
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


async def _discover_topics_async() -> Dict[str, Any]:
    """Async implementation of topic discovery"""
    github = get_github_service()
    cache = get_cache_service()

    try:
        # Fetch popular topics
        topics = await github.fetch_topics()

        if not topics:
            logger.warning("No topics discovered")
            return {
                "success": True,
                "topics_discovered": 0
            }

        # Store topics in database
        async with async_session_maker() as session:
            synced_count = 0

            for topic_name in topics:
                try:
                    # Upsert topic
                    stmt = insert(Topic).values(
                        name=topic_name,
                        display_name=topic_name.replace("-", " ").title(),
                        updated_at=datetime.utcnow()
                    )
                    stmt = stmt.on_conflict_do_update(
                        index_elements=["name"],
                        set_={"updated_at": datetime.utcnow()}
                    )

                    await session.execute(stmt)
                    synced_count += 1

                except Exception as e:
                    logger.error(f"Error syncing topic {topic_name}: {e}")

            await session.commit()

        # Cache topics
        await cache.cache_topics(topics)

        logger.info(f"Discovered and synced {synced_count} topics")

        return {
            "success": True,
            "topics_discovered": len(topics),
            "topics_synced": synced_count
        }

    except Exception as e:
        logger.error(f"Error in _discover_topics_async: {e}")
        raise


@celery_app.task(name="sync_topic", bind=True, max_retries=3)
def sync_topic(self, topic_name: str, fetch_repos: bool = True):
    """
    Sync a specific topic and optionally its repositories
    """
    logger.info(f"Syncing topic: {topic_name}")

    try:
        return run_async(_sync_topic_async(topic_name, fetch_repos))
    except Exception as e:
        logger.error(f"Error syncing topic {topic_name}: {e}")
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


async def _sync_topic_async(topic_name: str, fetch_repos: bool) -> Dict[str, Any]:
    """Async implementation of topic sync"""
    graphql = get_github_graphql_client()
    cache = get_cache_service()

    try:
        # Fetch topic repositories using GraphQL
        data = await graphql.fetch_repositories_by_topic(
            topic=topic_name,
            first=30
        )

        if "search" not in data:
            logger.warning(f"No data found for topic: {topic_name}")
            return {
                "success": False,
                "error": "No data found"
            }

        total_count = data["search"]["repositoryCount"]
        repos = []

        if "edges" in data["search"]:
            repos = [edge["node"] for edge in data["search"]["edges"]]

        # Update topic in database
        async with async_session_maker() as session:
            stmt = select(Topic).where(Topic.name == topic_name)
            result = await session.execute(stmt)
            topic = result.scalar_one_or_none()

            if topic:
                # Update repository count
                from sqlalchemy import update as sql_update
                stmt = sql_update(Topic).where(
                    Topic.id == topic.id
                ).values(
                    repository_count=total_count,
                    updated_at=datetime.utcnow()
                )
                await session.execute(stmt)
                await session.commit()
            else:
                # Create new topic
                stmt = insert(Topic).values(
                    name=topic_name,
                    display_name=topic_name.replace("-", " ").title(),
                    repository_count=total_count,
                    updated_at=datetime.utcnow()
                )
                await session.execute(stmt)
                await session.commit()

        # Optionally fetch repositories
        if fetch_repos and repos:
            from app.workers.sync_repos import sync_repository

            for repo_data in repos[:10]:  # Limit to top 10
                try:
                    owner = repo_data["nameWithOwner"].split("/")[0]
                    name = repo_data["name"]

                    # Queue repository sync
                    sync_repository.delay(owner, name)

                except Exception as e:
                    logger.error(f"Error queueing repo for topic {topic_name}: {e}")

        # Cache topic data
        cache_data = {
            "name": topic_name,
            "repository_count": total_count,
            "repositories": [
                {
                    "owner": repo["nameWithOwner"].split("/")[0],
                    "name": repo["name"],
                    "full_name": repo["nameWithOwner"],
                    "description": repo.get("description"),
                    "stars": repo.get("stargazerCount", 0),
                    "language": repo.get("primaryLanguage", {}).get("name") if repo.get("primaryLanguage") else None,
                    "url": repo.get("url")
                }
                for repo in repos
            ]
        }

        await cache.cache_topic_repos(topic_name, 1, cache_data)

        logger.info(f"Synced topic {topic_name}: {total_count} repositories")

        return {
            "success": True,
            "topic": topic_name,
            "repository_count": total_count,
            "repositories_fetched": len(repos)
        }

    except Exception as e:
        logger.error(f"Error in _sync_topic_async for {topic_name}: {e}")
        raise


@celery_app.task(name="sync_all_topics", bind=True)
def sync_all_topics(self):
    """
    Sync all topics in the database
    """
    logger.info("Syncing all topics")

    try:
        return run_async(_sync_all_topics_async())
    except Exception as e:
        logger.error(f"Error syncing all topics: {e}")
        raise


async def _sync_all_topics_async() -> Dict[str, Any]:
    """Async implementation of sync all topics"""
    try:
        # Get all topics from database
        async with async_session_maker() as session:
            stmt = select(Topic)
            result = await session.execute(stmt)
            topics = result.scalars().all()

        if not topics:
            logger.info("No topics found in database")
            return {
                "success": True,
                "topics_synced": 0
            }

        # Queue sync for each topic
        tasks_queued = 0
        for topic in topics:
            try:
                sync_topic.delay(topic.name, fetch_repos=False)
                tasks_queued += 1
            except Exception as e:
                logger.error(f"Error queueing sync for topic {topic.name}: {e}")

        logger.info(f"Queued {tasks_queued} topic sync tasks")

        return {
            "success": True,
            "topics_synced": tasks_queued
        }

    except Exception as e:
        logger.error(f"Error in _sync_all_topics_async: {e}")
        raise


@celery_app.task(name="update_topic_stats", bind=True)
def update_topic_stats(self):
    """
    Update topic statistics based on repository data
    Counts repositories using each topic
    """
    logger.info("Updating topic statistics")

    try:
        return run_async(_update_topic_stats_async())
    except Exception as e:
        logger.error(f"Error updating topic stats: {e}")
        raise


async def _update_topic_stats_async() -> Dict[str, Any]:
    """Async implementation of topic stats update"""
    try:
        async with async_session_maker() as session:
            # Get all unique topics from repositories
            stmt = select(Repository.topics).where(
                Repository.topics.isnot(None),
                Repository.topics != []
            )
            result = await session.execute(stmt)
            all_repos = result.scalars().all()

            # Count topic occurrences
            topic_counts = {}
            for topics_list in all_repos:
                if topics_list:
                    for topic in topics_list:
                        topic_counts[topic] = topic_counts.get(topic, 0) + 1

            # Update topics in database
            updated_count = 0

            for topic_name, count in topic_counts.items():
                try:
                    # Find or create topic
                    stmt = select(Topic).where(Topic.name == topic_name)
                    result = await session.execute(stmt)
                    topic = result.scalar_one_or_none()

                    if topic:
                        # Update count
                        from sqlalchemy import update as sql_update
                        stmt = sql_update(Topic).where(
                            Topic.id == topic.id
                        ).values(
                            repository_count=count,
                            updated_at=datetime.utcnow()
                        )
                        await session.execute(stmt)
                    else:
                        # Create new topic
                        stmt = insert(Topic).values(
                            name=topic_name,
                            display_name=topic_name.replace("-", " ").title(),
                            repository_count=count,
                            updated_at=datetime.utcnow()
                        )
                        await session.execute(stmt)

                    updated_count += 1

                except Exception as e:
                    logger.error(f"Error updating topic {topic_name}: {e}")

            await session.commit()

            logger.info(f"Updated statistics for {updated_count} topics")

            return {
                "success": True,
                "topics_updated": updated_count,
                "unique_topics": len(topic_counts)
            }

    except Exception as e:
        logger.error(f"Error in _update_topic_stats_async: {e}")
        raise


@celery_app.task(name="sync_trending_topics", bind=True)
def sync_trending_topics(self, limit: int = 20):
    """
    Sync trending topics (topics with most repositories)
    """
    logger.info(f"Syncing top {limit} trending topics")

    try:
        return run_async(_sync_trending_topics_async(limit))
    except Exception as e:
        logger.error(f"Error syncing trending topics: {e}")
        raise


async def _sync_trending_topics_async(limit: int) -> Dict[str, Any]:
    """Async implementation of trending topics sync"""
    try:
        async with async_session_maker() as session:
            # Get top topics by repository count
            stmt = select(Topic).order_by(
                Topic.repository_count.desc()
            ).limit(limit)

            result = await session.execute(stmt)
            topics = result.scalars().all()

        if not topics:
            logger.info("No topics found")
            return {
                "success": True,
                "topics_synced": 0
            }

        # Queue detailed sync for each trending topic
        tasks_queued = 0
        for topic in topics:
            try:
                sync_topic.delay(topic.name, fetch_repos=True)
                tasks_queued += 1
            except Exception as e:
                logger.error(f"Error queueing sync for trending topic {topic.name}: {e}")

        logger.info(f"Queued {tasks_queued} trending topic sync tasks")

        return {
            "success": True,
            "topics_synced": tasks_queued
        }

    except Exception as e:
        logger.error(f"Error in _sync_trending_topics_async: {e}")
        raise


@celery_app.task(name="cleanup_unused_topics", bind=True)
def cleanup_unused_topics(self, min_repos: int = 1):
    """
    Remove topics with fewer than min_repos repositories
    """
    logger.info(f"Cleaning up topics with fewer than {min_repos} repositories")

    try:
        return run_async(_cleanup_unused_topics_async(min_repos))
    except Exception as e:
        logger.error(f"Error cleaning up topics: {e}")
        raise


async def _cleanup_unused_topics_async(min_repos: int) -> Dict[str, Any]:
    """Async implementation of unused topics cleanup"""
    try:
        async with async_session_maker() as session:
            # Find topics with low repository count
            stmt = select(Topic).where(
                Topic.repository_count < min_repos
            )
            result = await session.execute(stmt)
            topics_to_delete = result.scalars().all()

            deleted_count = 0

            for topic in topics_to_delete:
                try:
                    await session.delete(topic)
                    deleted_count += 1
                except Exception as e:
                    logger.error(f"Error deleting topic {topic.name}: {e}")

            await session.commit()

            logger.info(f"Deleted {deleted_count} unused topics")

            return {
                "success": True,
                "topics_deleted": deleted_count
            }

    except Exception as e:
        logger.error(f"Error in _cleanup_unused_topics_async: {e}")
        raise
