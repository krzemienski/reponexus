"""
Trending Sync Workers
Celery tasks for syncing trending repository data
"""
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from sqlalchemy import select, update

from app.workers.celery import celery_app
from app.services.github_service import get_github_service
from app.services.cache_service import get_cache_service
from app.core.db import AsyncSessionLocal
from app.models.repository import Repository

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async functions in Celery tasks"""
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(coro)


@celery_app.task(name="sync_trending", bind=True, max_retries=3)
def sync_trending(self, period: str = "daily", language: Optional[str] = None):
    """
    Sync trending repositories for a given period
    period: "daily", "weekly", or "monthly"
    language: Optional language filter (e.g., "python", "javascript")
    """
    logger.info(f"Syncing trending repositories: period={period}, language={language}")

    try:
        return run_async(_sync_trending_async(period, language))
    except Exception as e:
        logger.error(f"Error syncing trending: {e}")
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


async def _sync_trending_async(period: str, language: Optional[str]) -> Dict[str, Any]:
    """Async implementation of trending sync"""
    github = get_github_service()
    cache = get_cache_service()

    try:
        # Fetch trending repositories from GitHub
        trending_repos = await github.fetch_trending(period=period, language=language)

        if not trending_repos:
            logger.warning(f"No trending repositories found for {period}/{language}")
            return {
                "success": True,
                "period": period,
                "language": language,
                "repositories_found": 0
            }

        # Calculate trending scores based on position
        # Higher score for top positions
        max_score = len(trending_repos)

        synced_count = 0
        for idx, repo_data in enumerate(trending_repos):
            try:
                owner = repo_data["owner"]
                name = repo_data["name"]

                # Calculate trending score (higher for top positions)
                trending_score = max_score - idx

                # Update repository in database
                async with AsyncSessionLocal() as session:
                    # Find repository by name_with_owner
                    stmt = select(Repository).where(
                        Repository.name_with_owner == f"{owner}/{name}"
                    )
                    result = await session.execute(stmt)
                    repo = result.scalar_one_or_none()

                    if repo:
                        # Update existing repository
                        stmt = update(Repository).where(
                            Repository.id == repo.id
                        ).values(
                            trending_score=trending_score,
                            last_fetched_at=datetime.utcnow()
                        )
                        await session.execute(stmt)
                        await session.commit()

                        synced_count += 1
                        logger.debug(f"Updated trending score for {owner}/{name}: {trending_score}")
                    else:
                        # Repository not in database, queue for sync
                        from app.workers.sync_repos import sync_repository
                        sync_repository.delay(owner, name)
                        logger.debug(f"Queued new trending repo for sync: {owner}/{name}")

            except Exception as e:
                logger.error(f"Error processing trending repo: {e}")

        # Cache trending data
        await cache.cache_trending(period, language, trending_repos)

        logger.info(f"Synced {synced_count} trending repositories for {period}/{language}")

        return {
            "success": True,
            "period": period,
            "language": language,
            "repositories_found": len(trending_repos),
            "repositories_synced": synced_count
        }

    except Exception as e:
        logger.error(f"Error in _sync_trending_async: {e}")
        raise


@celery_app.task(name="sync_all_trending", bind=True)
def sync_all_trending(self):
    """
    Sync trending repositories for all periods and popular languages
    """
    logger.info("Syncing all trending repositories")

    try:
        return run_async(_sync_all_trending_async())
    except Exception as e:
        logger.error(f"Error in sync_all_trending: {e}")
        raise


async def _sync_all_trending_async() -> Dict[str, Any]:
    """Async implementation of sync all trending"""
    periods = ["daily", "weekly", "monthly"]
    languages = [
        None,  # All languages
        "python",
        "javascript",
        "typescript",
        "java",
        "go",
        "rust",
        "cpp",
        "ruby",
        "php"
    ]

    tasks_queued = 0

    # Queue sync tasks for each combination
    for period in periods:
        for language in languages:
            try:
                sync_trending.delay(period, language)
                tasks_queued += 1
            except Exception as e:
                logger.error(f"Error queueing trending sync for {period}/{language}: {e}")

    logger.info(f"Queued {tasks_queued} trending sync tasks")

    return {
        "success": True,
        "tasks_queued": tasks_queued
    }


@celery_app.task(name="calculate_trending_scores", bind=True)
def calculate_trending_scores(self):
    """
    Calculate trending scores for all repositories based on recent activity
    Uses stars, forks, and recent updates as signals
    """
    logger.info("Calculating trending scores")

    try:
        return run_async(_calculate_trending_scores_async())
    except Exception as e:
        logger.error(f"Error calculating trending scores: {e}")
        raise


async def _calculate_trending_scores_async() -> Dict[str, Any]:
    """Async implementation of trending score calculation"""
    try:
        # Calculate scores based on recent activity
        # Score = (stars * 0.4) + (forks * 0.3) + (recency_factor * 0.3)

        async with AsyncSessionLocal() as session:
            # Get repositories updated in last 30 days
            cutoff_date = datetime.utcnow() - timedelta(days=30)

            stmt = select(Repository).where(
                Repository.updated_at >= cutoff_date
            )
            result = await session.execute(stmt)
            repos = result.scalars().all()

            logger.info(f"Calculating scores for {len(repos)} repositories")

            updated_count = 0

            for repo in repos:
                try:
                    # Calculate recency factor (0-100)
                    days_since_update = (datetime.utcnow() - repo.updated_at).days
                    recency_factor = max(0, 100 - (days_since_update * 3))

                    # Calculate trending score
                    star_score = min(repo.stargazer_count * 0.4, 40)
                    fork_score = min(repo.fork_count * 0.3, 30)
                    recency_score = recency_factor * 0.3

                    trending_score = int(star_score + fork_score + recency_score)

                    # Update repository
                    stmt = update(Repository).where(
                        Repository.id == repo.id
                    ).values(trending_score=trending_score)

                    await session.execute(stmt)
                    updated_count += 1

                except Exception as e:
                    logger.error(f"Error calculating score for {repo.name_with_owner}: {e}")

            await session.commit()

            logger.info(f"Updated trending scores for {updated_count} repositories")

            return {
                "success": True,
                "repositories_processed": len(repos),
                "repositories_updated": updated_count
            }

    except Exception as e:
        logger.error(f"Error in _calculate_trending_scores_async: {e}")
        raise


@celery_app.task(name="update_trending_cache", bind=True)
def update_trending_cache(self):
    """
    Update trending cache from database
    Fetches top repositories by trending_score and caches them
    """
    logger.info("Updating trending cache")

    try:
        return run_async(_update_trending_cache_async())
    except Exception as e:
        logger.error(f"Error updating trending cache: {e}")
        raise


async def _update_trending_cache_async() -> Dict[str, Any]:
    """Async implementation of trending cache update"""
    cache = get_cache_service()

    try:
        # Get top trending repositories from database
        async with AsyncSessionLocal() as session:
            # Overall trending (all languages)
            stmt = select(Repository).order_by(
                Repository.trending_score.desc()
            ).limit(50)
            result = await session.execute(stmt)
            overall_trending = result.scalars().all()

            # Convert to dict format
            overall_data = [
                {
                    "owner": repo.owner_login,
                    "name": repo.name,
                    "full_name": repo.name_with_owner,
                    "description": repo.description,
                    "language": repo.primary_language,
                    "stars": repo.stargazer_count,
                    "forks": repo.fork_count,
                    "trending_score": repo.trending_score,
                    "url": repo.html_url
                }
                for repo in overall_trending
            ]

            # Cache overall trending
            await cache.cache_trending("daily", None, overall_data)

            # Get trending by popular languages
            languages = ["python", "javascript", "typescript", "java", "go", "rust"]

            for language in languages:
                stmt = select(Repository).where(
                    Repository.primary_language == language.capitalize()
                ).order_by(
                    Repository.trending_score.desc()
                ).limit(30)

                result = await session.execute(stmt)
                lang_repos = result.scalars().all()

                lang_data = [
                    {
                        "owner": repo.owner_login,
                        "name": repo.name,
                        "full_name": repo.name_with_owner,
                        "description": repo.description,
                        "language": repo.primary_language,
                        "stars": repo.stargazer_count,
                        "forks": repo.fork_count,
                        "trending_score": repo.trending_score,
                        "url": repo.html_url
                    }
                    for repo in lang_repos
                ]

                await cache.cache_trending("daily", language, lang_data)

            logger.info(f"Updated trending cache for overall and {len(languages)} languages")

            return {
                "success": True,
                "overall_count": len(overall_data),
                "languages_processed": len(languages)
            }

    except Exception as e:
        logger.error(f"Error in _update_trending_cache_async: {e}")
        raise


@celery_app.task(name="cleanup_old_trending_scores", bind=True)
def cleanup_old_trending_scores(self, days: int = 60):
    """
    Reset trending scores for repositories not updated in X days
    """
    logger.info(f"Cleaning up trending scores older than {days} days")

    try:
        return run_async(_cleanup_old_trending_scores_async(days))
    except Exception as e:
        logger.error(f"Error cleaning up trending scores: {e}")
        raise


async def _cleanup_old_trending_scores_async(days: int) -> Dict[str, Any]:
    """Async implementation of trending scores cleanup"""
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)

        async with AsyncSessionLocal() as session:
            # Reset trending scores for old repositories
            stmt = update(Repository).where(
                Repository.updated_at < cutoff_date,
                Repository.trending_score > 0
            ).values(trending_score=0)

            result = await session.execute(stmt)
            await session.commit()

            reset_count = result.rowcount

            logger.info(f"Reset trending scores for {reset_count} repositories")

            return {
                "success": True,
                "repositories_reset": reset_count
            }

    except Exception as e:
        logger.error(f"Error in _cleanup_old_trending_scores_async: {e}")
        raise
