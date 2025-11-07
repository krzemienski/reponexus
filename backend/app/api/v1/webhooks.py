"""
GitHub Webhook Handler
Processes GitHub webhook events for real-time updates
"""
import hmac
import hashlib
import logging
from typing import Dict, Any
from fastapi import APIRouter, Request, HTTPException, Header
from datetime import datetime

from app.core.config import settings
from app.workers.sync_repos import sync_repository, update_repository_stats

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def verify_signature(payload_body: bytes, signature: str, secret: str) -> bool:
    """
    Verify GitHub webhook signature
    """
    if not signature:
        return False

    # GitHub sends signature as "sha256=<signature>"
    if not signature.startswith("sha256="):
        return False

    expected_signature = signature.split("=")[1]

    # Calculate HMAC
    mac = hmac.new(
        secret.encode(),
        msg=payload_body,
        digestmod=hashlib.sha256
    )
    computed_signature = mac.hexdigest()

    # Compare signatures
    return hmac.compare_digest(computed_signature, expected_signature)


@router.post("/github")
async def handle_github_webhook(
    request: Request,
    x_github_event: str = Header(None),
    x_hub_signature_256: str = Header(None)
):
    """
    Handle GitHub webhook events

    Supported events:
    - push: Update repository pushed_at timestamp
    - star: Update star count
    - fork: Update fork count
    - repository: Update repository data
    """
    try:
        # Read raw body
        body = await request.body()

        # Verify signature if secret is configured
        webhook_secret = settings.GITHUB_CLIENT_SECRET
        if webhook_secret:
            if not verify_signature(body, x_hub_signature_256, webhook_secret):
                logger.warning("Invalid webhook signature")
                raise HTTPException(status_code=401, detail="Invalid signature")

        # Parse JSON
        payload = await request.json()

        # Get event type
        event_type = x_github_event
        logger.info(f"Received GitHub webhook: {event_type}")

        # Route to appropriate handler
        if event_type == "push":
            return await handle_push_event(payload)
        elif event_type == "star":
            return await handle_star_event(payload)
        elif event_type == "fork":
            return await handle_fork_event(payload)
        elif event_type == "repository":
            return await handle_repository_event(payload)
        elif event_type == "ping":
            return {"status": "pong"}
        else:
            logger.info(f"Unhandled webhook event: {event_type}")
            return {"status": "ignored", "event": event_type}

    except Exception as e:
        logger.error(f"Error handling webhook: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def handle_push_event(payload: Dict[str, Any]) -> Dict[str, str]:
    """
    Handle push event - update repository pushed_at timestamp
    """
    try:
        repo = payload.get("repository", {})
        owner = repo.get("owner", {}).get("login")
        name = repo.get("name")

        if not owner or not name:
            logger.warning("Push event missing repository info")
            return {"status": "error", "message": "Missing repository info"}

        logger.info(f"Push event for {owner}/{name}")

        # Queue repository sync to update pushed_at and other data
        sync_repository.delay(owner, name)

        return {
            "status": "queued",
            "event": "push",
            "repository": f"{owner}/{name}"
        }

    except Exception as e:
        logger.error(f"Error handling push event: {e}")
        return {"status": "error", "message": str(e)}


async def handle_star_event(payload: Dict[str, Any]) -> Dict[str, str]:
    """
    Handle star event - update star count
    """
    try:
        action = payload.get("action")  # "created" or "deleted"
        repo = payload.get("repository", {})
        owner = repo.get("owner", {}).get("login")
        name = repo.get("name")
        stars = repo.get("stargazers_count", 0)

        if not owner or not name:
            logger.warning("Star event missing repository info")
            return {"status": "error", "message": "Missing repository info"}

        logger.info(f"Star event for {owner}/{name}: {action}, total stars: {stars}")

        # Update repository stats
        update_repository_stats.delay(
            owner,
            name,
            {"stars": stars}
        )

        return {
            "status": "queued",
            "event": "star",
            "action": action,
            "repository": f"{owner}/{name}",
            "stars": stars
        }

    except Exception as e:
        logger.error(f"Error handling star event: {e}")
        return {"status": "error", "message": str(e)}


async def handle_fork_event(payload: Dict[str, Any]) -> Dict[str, str]:
    """
    Handle fork event - update fork count
    """
    try:
        repo = payload.get("repository", {})
        owner = repo.get("owner", {}).get("login")
        name = repo.get("name")
        forks = repo.get("forks_count", 0)

        if not owner or not name:
            logger.warning("Fork event missing repository info")
            return {"status": "error", "message": "Missing repository info"}

        logger.info(f"Fork event for {owner}/{name}, total forks: {forks}")

        # Update repository stats
        update_repository_stats.delay(
            owner,
            name,
            {"forks": forks}
        )

        return {
            "status": "queued",
            "event": "fork",
            "repository": f"{owner}/{name}",
            "forks": forks
        }

    except Exception as e:
        logger.error(f"Error handling fork event: {e}")
        return {"status": "error", "message": str(e)}


async def handle_repository_event(payload: Dict[str, Any]) -> Dict[str, str]:
    """
    Handle repository event - full repository update
    """
    try:
        action = payload.get("action")  # created, deleted, archived, etc.
        repo = payload.get("repository", {})
        owner = repo.get("owner", {}).get("login")
        name = repo.get("name")

        if not owner or not name:
            logger.warning("Repository event missing repository info")
            return {"status": "error", "message": "Missing repository info"}

        logger.info(f"Repository event for {owner}/{name}: {action}")

        # For most actions, sync the repository
        if action in ["created", "edited", "publicized", "privatized", "archived", "unarchived"]:
            sync_repository.delay(owner, name)

            return {
                "status": "queued",
                "event": "repository",
                "action": action,
                "repository": f"{owner}/{name}"
            }
        elif action == "deleted":
            # TODO: Handle repository deletion
            logger.info(f"Repository deleted: {owner}/{name}")
            return {
                "status": "acknowledged",
                "event": "repository",
                "action": "deleted",
                "repository": f"{owner}/{name}"
            }
        else:
            return {
                "status": "ignored",
                "event": "repository",
                "action": action,
                "repository": f"{owner}/{name}"
            }

    except Exception as e:
        logger.error(f"Error handling repository event: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/github/test")
async def test_webhook():
    """
    Test endpoint to verify webhook handler is working
    """
    return {
        "status": "ok",
        "message": "Webhook handler is operational",
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/github/manual")
async def manual_webhook_trigger(
    event_type: str,
    owner: str,
    name: str
):
    """
    Manual webhook trigger for testing
    Simulates a webhook event without requiring GitHub
    """
    logger.info(f"Manual webhook trigger: {event_type} for {owner}/{name}")

    try:
        if event_type == "sync":
            sync_repository.delay(owner, name)
            return {
                "status": "queued",
                "event": event_type,
                "repository": f"{owner}/{name}"
            }
        elif event_type == "stats":
            # Fetch current stats from GitHub
            sync_repository.delay(owner, name)
            return {
                "status": "queued",
                "event": event_type,
                "repository": f"{owner}/{name}"
            }
        else:
            raise HTTPException(status_code=400, detail=f"Unknown event type: {event_type}")

    except Exception as e:
        logger.error(f"Error in manual webhook trigger: {e}")
        raise HTTPException(status_code=500, detail=str(e))
