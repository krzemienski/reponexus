"""
Repository Sync Workers
Celery tasks for syncing repository data from GitHub
"""
import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert

from app.workers.celery import celery_app
from app.services.github_service import get_github_service
from app.services.github_graphql import get_github_graphql_client
from app.services.cache_service import get_cache_service
from app.core.db import async_session_maker
from app.models.repository import Repository

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async functions in Celery tasks"""
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(coro)


@celery_app.task(name="sync_repository", bind=True, max_retries=3)
def sync_repository(self, owner: str, name: str):
    """
    Sync a single repository from GitHub
    """
    logger.info(f"Syncing repository: {owner}/{name}")

    try:
        return run_async(_sync_repository_async(owner, name))
    except Exception as e:
        logger.error(f"Error syncing repository {owner}/{name}: {e}")
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


async def _sync_repository_async(owner: str, name: str) -> Dict[str, Any]:
    """Async implementation of repository sync"""
    github = get_github_service()
    cache = get_cache_service()

    try:
        # Fetch repository data from GitHub
        repo_data = await github.fetch_repository(owner, name)

        # Fetch additional data
        languages = await github.fetch_languages(owner, name)
        readme = await github.fetch_readme(owner, name)

        # Parse and prepare data for database
        db_data = {
            "github_id": str(repo_data["id"]),
            "node_id": repo_data["node_id"],
            "name_with_owner": repo_data["full_name"],
            "name": repo_data["name"],
            "owner_login": repo_data["owner"]["login"],
            "description": repo_data.get("description"),
            "is_private": repo_data["private"],
            "is_fork": repo_data["fork"],
            "is_archived": repo_data["archived"],
            "stargazer_count": repo_data["stargazers_count"],
            "watcher_count": repo_data["watchers_count"],
            "fork_count": repo_data["forks_count"],
            "open_issues_count": repo_data["open_issues_count"],
            "primary_language": repo_data.get("language"),
            "languages": languages,
            "topics": repo_data.get("topics", []),
            "html_url": repo_data["html_url"],
            "api_url": repo_data["url"],
            "clone_url": repo_data.get("clone_url"),
            "created_at": datetime.fromisoformat(repo_data["created_at"].replace("Z", "+00:00")),
            "updated_at": datetime.fromisoformat(repo_data["updated_at"].replace("Z", "+00:00")),
            "pushed_at": datetime.fromisoformat(repo_data["pushed_at"].replace("Z", "+00:00")) if repo_data.get("pushed_at") else None,
            "last_fetched_at": datetime.utcnow(),
        }

        # Upsert to database
        async with async_session_maker() as session:
            stmt = insert(Repository).values(**db_data)
            stmt = stmt.on_conflict_do_update(
                index_elements=["github_id"],
                set_=db_data
            )
            await session.execute(stmt)
            await session.commit()

        # Cache the data
        await cache.cache_repository(owner, name, repo_data)
        await cache.cache_languages(owner, name, languages)
        if readme:
            await cache.cache_readme(owner, name, readme)

        logger.info(f"Successfully synced repository: {owner}/{name}")

        return {
            "success": True,
            "repository": f"{owner}/{name}",
            "stars": db_data["stargazer_count"]
        }

    except Exception as e:
        logger.error(f"Error in _sync_repository_async for {owner}/{name}: {e}")
        raise


@celery_app.task(name="sync_user_repositories", bind=True, max_retries=3)
def sync_user_repositories(self, username: str, max_repos: int = 100):
    """
    Sync all public repositories for a user
    """
    logger.info(f"Syncing repositories for user: {username}")

    try:
        return run_async(_sync_user_repositories_async(username, max_repos))
    except Exception as e:
        logger.error(f"Error syncing user repositories for {username}: {e}")
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


async def _sync_user_repositories_async(username: str, max_repos: int) -> Dict[str, Any]:
    """Async implementation of user repositories sync"""
    graphql = get_github_graphql_client()

    try:
        synced_count = 0
        has_next_page = True
        cursor = None

        while has_next_page and synced_count < max_repos:
            # Fetch user repos using GraphQL
            data = await graphql.fetch_user_with_repos(
                username=username,
                first=min(30, max_repos - synced_count),
                after=cursor
            )

            if "user" not in data or not data["user"]:
                logger.warning(f"User not found: {username}")
                break

            repos = data["user"]["repositories"]["nodes"]
            page_info = data["user"]["repositories"]["pageInfo"]

            # Sync each repository
            for repo in repos:
                try:
                    owner = repo["nameWithOwner"].split("/")[0]
                    name = repo["name"]

                    # Queue individual repo sync
                    sync_repository.delay(owner, name)
                    synced_count += 1

                except Exception as e:
                    logger.error(f"Error queueing repo sync: {e}")

            has_next_page = page_info["hasNextPage"]
            cursor = page_info["endCursor"]

        logger.info(f"Queued {synced_count} repositories for user {username}")

        return {
            "success": True,
            "username": username,
            "repositories_queued": synced_count
        }

    except Exception as e:
        logger.error(f"Error in _sync_user_repositories_async for {username}: {e}")
        raise


@celery_app.task(name="sync_all_repositories", bind=True)
def sync_all_repositories(self, limit: int = 1000):
    """
    Full sync of all repositories in database
    Re-fetches data from GitHub for existing repositories
    """
    logger.info(f"Starting full repository sync (limit: {limit})")

    try:
        return run_async(_sync_all_repositories_async(limit))
    except Exception as e:
        logger.error(f"Error in sync_all_repositories: {e}")
        raise


async def _sync_all_repositories_async(limit: int) -> Dict[str, Any]:
    """Async implementation of full repository sync"""
    try:
        synced_count = 0

        # Get repositories from database
        async with async_session_maker() as session:
            # Order by last_fetched_at to prioritize stale data
            stmt = select(Repository).order_by(Repository.last_fetched_at).limit(limit)
            result = await session.execute(stmt)
            repos = result.scalars().all()

        logger.info(f"Found {len(repos)} repositories to sync")

        # Queue sync tasks for each repository
        for repo in repos:
            try:
                sync_repository.delay(repo.owner_login, repo.name)
                synced_count += 1

            except Exception as e:
                logger.error(f"Error queueing sync for {repo.name_with_owner}: {e}")

        logger.info(f"Queued {synced_count} repositories for sync")

        return {
            "success": True,
            "repositories_queued": synced_count
        }

    except Exception as e:
        logger.error(f"Error in _sync_all_repositories_async: {e}")
        raise


@celery_app.task(name="batch_sync_repositories", bind=True)
def batch_sync_repositories(self, repos: List[Dict[str, str]]):
    """
    Batch sync multiple repositories
    repos: [{"owner": "...", "name": "..."}, ...]
    """
    logger.info(f"Batch syncing {len(repos)} repositories")

    try:
        return run_async(_batch_sync_repositories_async(repos))
    except Exception as e:
        logger.error(f"Error in batch_sync_repositories: {e}")
        raise


async def _batch_sync_repositories_async(repos: List[Dict[str, str]]) -> Dict[str, Any]:
    """Async implementation of batch repository sync"""
    try:
        success_count = 0
        error_count = 0

        # Use GraphQL to fetch multiple repos efficiently
        graphql = get_github_graphql_client()

        # Process in batches of 10 (GraphQL limitation)
        for i in range(0, len(repos), 10):
            batch = repos[i:i+10]

            try:
                # Fetch batch using GraphQL
                repo_data_list = await graphql.fetch_multiple_repositories(batch)

                # Process each repository
                for repo_data in repo_data_list:
                    try:
                        owner = repo_data["nameWithOwner"].split("/")[0]
                        name = repo_data["name"]

                        # Queue individual sync
                        sync_repository.delay(owner, name)
                        success_count += 1

                    except Exception as e:
                        logger.error(f"Error processing repo in batch: {e}")
                        error_count += 1

            except Exception as e:
                logger.error(f"Error fetching batch: {e}")
                error_count += len(batch)

        logger.info(f"Batch sync complete: {success_count} queued, {error_count} errors")

        return {
            "success": True,
            "repositories_queued": success_count,
            "errors": error_count
        }

    except Exception as e:
        logger.error(f"Error in _batch_sync_repositories_async: {e}")
        raise


@celery_app.task(name="update_repository_stats", bind=True)
def update_repository_stats(self, owner: str, name: str, stats: Dict[str, int]):
    """
    Update repository statistics (used by webhook handler)
    stats: {"stars": 123, "forks": 45, "watchers": 67}
    """
    logger.info(f"Updating stats for {owner}/{name}")

    try:
        return run_async(_update_repository_stats_async(owner, name, stats))
    except Exception as e:
        logger.error(f"Error updating repository stats: {e}")
        raise


async def _update_repository_stats_async(
    owner: str,
    name: str,
    stats: Dict[str, int]
) -> Dict[str, Any]:
    """Async implementation of repository stats update"""
    try:
        async with async_session_maker() as session:
            # Find repository
            stmt = select(Repository).where(
                Repository.owner_login == owner,
                Repository.name == name
            )
            result = await session.execute(stmt)
            repo = result.scalar_one_or_none()

            if not repo:
                logger.warning(f"Repository not found: {owner}/{name}")
                return {"success": False, "error": "Repository not found"}

            # Update stats
            update_data = {}
            if "stars" in stats:
                update_data["stargazer_count"] = stats["stars"]
            if "forks" in stats:
                update_data["fork_count"] = stats["forks"]
            if "watchers" in stats:
                update_data["watcher_count"] = stats["watchers"]

            if update_data:
                stmt = update(Repository).where(
                    Repository.id == repo.id
                ).values(**update_data)
                await session.execute(stmt)
                await session.commit()

                # Invalidate cache
                cache = get_cache_service()
                await cache.invalidate_repository(owner, name)

                logger.info(f"Updated stats for {owner}/{name}: {update_data}")

        return {
            "success": True,
            "repository": f"{owner}/{name}",
            "updated": update_data
        }

    except Exception as e:
        logger.error(f"Error in _update_repository_stats_async: {e}")
        raise
