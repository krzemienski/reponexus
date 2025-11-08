"""
Sync Tasks Workers
Celery tasks for syncing starred repos and generating suggestions
"""
import asyncio
import logging
from typing import Dict, Any, Optional

from app.workers.celery import celery_app
from app.services.github_sync_service import get_sync_service
from app.services.suggestion_service import get_suggestion_engine

logger = logging.getLogger(__name__)


def run_async(coro):
    """Helper to run async functions in Celery tasks"""
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(coro)


@celery_app.task(name="sync_starred_repos", bind=True, max_retries=3)
def sync_starred_repos(self, user_id: str, max_repos: Optional[int] = None):
    """
    Sync user's starred repositories from GitHub

    Args:
        user_id: UUID of the user
        max_repos: Maximum number of repos to sync (None for all)

    Returns:
        Dictionary with sync results
    """
    logger.info(f"Starting sync_starred_repos task for user {user_id}")

    try:
        sync_service = get_sync_service()
        result = run_async(sync_service.sync_user_starred_repos(user_id, max_repos))

        if result.get("success"):
            logger.info(f"Successfully synced starred repos for user {user_id}")

            # Chain: Generate suggestions after sync completes
            generate_topic_suggestions.delay(user_id)

        return result

    except Exception as e:
        logger.error(f"Error syncing starred repos for user {user_id}: {e}")
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@celery_app.task(name="generate_topic_suggestions", bind=True, max_retries=3)
def generate_topic_suggestions(self, user_id: str):
    """
    Generate topic suggestions for a user based on their starred repos

    Args:
        user_id: UUID of the user

    Returns:
        Dictionary with generation results
    """
    logger.info(f"Starting generate_topic_suggestions task for user {user_id}")

    try:
        suggestion_engine = get_suggestion_engine()

        # Generate suggestions
        suggestions = run_async(suggestion_engine.generate_suggestions(user_id))

        logger.info(f"Generated {len(suggestions)} suggestions for user {user_id}")

        # Save suggestions to database
        saved_count = run_async(suggestion_engine.save_suggestions(user_id, suggestions))

        logger.info(f"Saved {saved_count} suggestions for user {user_id}")

        return {
            "success": True,
            "user_id": user_id,
            "suggestions_generated": len(suggestions),
            "suggestions_saved": saved_count
        }

    except Exception as e:
        logger.error(f"Error generating suggestions for user {user_id}: {e}")
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@celery_app.task(name="sync_and_suggest", bind=True)
def sync_and_suggest(self, user_id: str, max_repos: Optional[int] = None):
    """
    Combined task: Sync starred repos and generate suggestions

    This is a wrapper that chains the two tasks together

    Args:
        user_id: UUID of the user
        max_repos: Maximum number of repos to sync (None for all)

    Returns:
        Task ID of the sync task
    """
    logger.info(f"Starting sync_and_suggest task chain for user {user_id}")

    # Start the sync task (which will chain to suggestions)
    task = sync_starred_repos.delay(user_id, max_repos)

    return {
        "success": True,
        "task_id": task.id,
        "user_id": user_id
    }


@celery_app.task(name="refresh_suggestions", bind=True)
def refresh_suggestions(self, user_id: str):
    """
    Refresh topic suggestions without re-syncing starred repos

    Useful when user follows/unfollows topics and wants updated suggestions

    Args:
        user_id: UUID of the user

    Returns:
        Dictionary with results
    """
    logger.info(f"Refreshing suggestions for user {user_id}")

    try:
        # Just regenerate suggestions from existing starred repos
        return generate_topic_suggestions(user_id)

    except Exception as e:
        logger.error(f"Error refreshing suggestions for user {user_id}: {e}")
        raise self.retry(exc=e, countdown=30)


@celery_app.task(name="batch_sync_users", bind=True)
def batch_sync_users(self, user_ids: list):
    """
    Batch sync starred repos for multiple users

    Args:
        user_ids: List of user UUIDs

    Returns:
        Dictionary with batch results
    """
    logger.info(f"Starting batch sync for {len(user_ids)} users")

    results = {
        "total": len(user_ids),
        "queued": 0,
        "failed": 0
    }

    for user_id in user_ids:
        try:
            sync_starred_repos.delay(user_id)
            results["queued"] += 1
        except Exception as e:
            logger.error(f"Error queueing sync for user {user_id}: {e}")
            results["failed"] += 1

    logger.info(f"Batch sync complete: {results['queued']} queued, {results['failed']} failed")

    return results


@celery_app.task(name="get_sync_progress", bind=True)
def get_sync_progress(self, task_id: str):
    """
    Get progress of a sync task

    Args:
        task_id: Celery task ID

    Returns:
        Dictionary with task status and result
    """
    from celery.result import AsyncResult

    task_result = AsyncResult(task_id, app=celery_app)

    return {
        "task_id": task_id,
        "status": task_result.status,
        "ready": task_result.ready(),
        "successful": task_result.successful() if task_result.ready() else None,
        "result": task_result.result if task_result.ready() else None,
        "error": str(task_result.info) if task_result.failed() else None
    }
