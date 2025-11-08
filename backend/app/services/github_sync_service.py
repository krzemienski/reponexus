"""
GitHub Sync Service
Syncs user's starred repositories from GitHub API
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.core.db import AsyncSessionLocal
from app.models.user import User
from app.models.repository import Repository
from app.models.starred_repository import StarredRepository
from app.services.github_service import get_github_service

logger = logging.getLogger(__name__)


class GitHubSyncService:
    """
    Service for syncing user data from GitHub
    """

    def __init__(self):
        self.github_service = get_github_service()

    async def sync_user_starred_repos(
        self,
        user_id: str,
        max_repos: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Sync all starred repositories for a user from GitHub

        Args:
            user_id: UUID of the user
            max_repos: Maximum number of repos to sync (None for all)

        Returns:
            Dictionary with sync statistics
        """
        logger.info(f"Starting starred repos sync for user {user_id}")

        async with AsyncSessionLocal() as session:
            # Get user with access token
            stmt = select(User).where(User.id == user_id)
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()

            if not user:
                logger.error(f"User not found: {user_id}")
                return {
                    "success": False,
                    "error": "User not found"
                }

            if not user.access_token:
                logger.error(f"User {user_id} has no access token")
                return {
                    "success": False,
                    "error": "No access token available"
                }

            # Fetch starred repos from GitHub with pagination
            all_starred = []
            page = 1
            per_page = 100
            total_fetched = 0

            try:
                while True:
                    logger.info(f"Fetching page {page} of starred repos")

                    # Fetch starred repos page
                    starred_page = await self._fetch_starred_page(
                        user.access_token,
                        page,
                        per_page
                    )

                    if not starred_page:
                        break

                    all_starred.extend(starred_page)
                    total_fetched += len(starred_page)

                    logger.info(f"Fetched {len(starred_page)} repos, total: {total_fetched}")

                    # Check if we've reached the limit
                    if max_repos and total_fetched >= max_repos:
                        all_starred = all_starred[:max_repos]
                        break

                    # Check if this is the last page
                    if len(starred_page) < per_page:
                        break

                    page += 1

                logger.info(f"Fetched {len(all_starred)} total starred repos from GitHub")

                # Process and store starred repos
                repos_created = 0
                repos_updated = 0
                stars_created = 0
                stars_updated = 0

                for repo_data in all_starred:
                    try:
                        # Upsert repository
                        repo_result = await self._upsert_repository(session, repo_data)
                        if repo_result["created"]:
                            repos_created += 1
                        else:
                            repos_updated += 1

                        # Upsert starred relationship
                        star_result = await self._upsert_starred_repo(
                            session,
                            user_id,
                            repo_result["repo_id"],
                            repo_data.get("starred_at")
                        )
                        if star_result["created"]:
                            stars_created += 1
                        else:
                            stars_updated += 1

                    except Exception as e:
                        logger.error(f"Error processing repo {repo_data.get('full_name')}: {e}")
                        continue

                await session.commit()

                logger.info(
                    f"Sync complete: {repos_created} repos created, {repos_updated} updated, "
                    f"{stars_created} stars created, {stars_updated} updated"
                )

                return {
                    "success": True,
                    "total_starred": len(all_starred),
                    "repos_created": repos_created,
                    "repos_updated": repos_updated,
                    "stars_created": stars_created,
                    "stars_updated": stars_updated,
                }

            except Exception as e:
                logger.error(f"Error syncing starred repos: {e}")
                await session.rollback()
                return {
                    "success": False,
                    "error": str(e)
                }

    async def _fetch_starred_page(
        self,
        access_token: str,
        page: int,
        per_page: int
    ) -> List[Dict[str, Any]]:
        """
        Fetch a page of starred repositories from GitHub

        Args:
            access_token: GitHub access token
            page: Page number
            per_page: Items per page

        Returns:
            List of repository dictionaries
        """
        try:
            # Use GitHub API to fetch starred repos
            params = {
                "page": page,
                "per_page": per_page,
                "sort": "created",
                "direction": "desc"
            }

            # Note: GitHub API endpoint for starred repos
            starred_repos = await self.github_service._make_request(
                method="GET",
                endpoint="/user/starred",
                token=access_token,
                params=params
            )

            return starred_repos

        except Exception as e:
            logger.error(f"Error fetching starred repos page {page}: {e}")
            return []

    async def _upsert_repository(
        self,
        session,
        repo_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Insert or update repository in database

        Args:
            session: Database session
            repo_data: Repository data from GitHub

        Returns:
            Dictionary with repo_id and created flag
        """
        # Prepare repository data
        db_data = {
            "github_id": str(repo_data["id"]),
            "node_id": repo_data["node_id"],
            "name_with_owner": repo_data["full_name"],
            "name": repo_data["name"],
            "owner_login": repo_data["owner"]["login"],
            "description": repo_data.get("description"),
            "is_private": repo_data["private"],
            "is_fork": repo_data.get("fork", False),
            "is_archived": repo_data.get("archived", False),
            "stargazer_count": repo_data.get("stargazers_count", 0),
            "watcher_count": repo_data.get("watchers_count", 0),
            "fork_count": repo_data.get("forks_count", 0),
            "open_issues_count": repo_data.get("open_issues_count", 0),
            "primary_language": repo_data.get("language"),
            "languages": {},  # Will be fetched separately if needed
            "topics": repo_data.get("topics", []),
            "html_url": repo_data["html_url"],
            "api_url": repo_data["url"],
            "clone_url": repo_data.get("clone_url"),
            "created_at": datetime.fromisoformat(repo_data["created_at"].replace("Z", "+00:00")).replace(tzinfo=None),
            "updated_at": datetime.fromisoformat(repo_data["updated_at"].replace("Z", "+00:00")).replace(tzinfo=None),
            "pushed_at": datetime.fromisoformat(repo_data["pushed_at"].replace("Z", "+00:00")).replace(tzinfo=None) if repo_data.get("pushed_at") else None,
            "last_fetched_at": datetime.utcnow(),
        }

        # Upsert repository
        stmt = insert(Repository).values(**db_data)
        stmt = stmt.on_conflict_do_update(
            index_elements=["github_id"],
            set_={
                **db_data,
                "last_fetched_at": datetime.utcnow()
            }
        )
        stmt = stmt.returning(Repository.id, Repository.github_id)
        result = await session.execute(stmt)
        row = result.first()

        # Check if it was created or updated
        check_stmt = select(Repository).where(Repository.github_id == str(repo_data["id"]))
        check_result = await session.execute(check_stmt)
        repo = check_result.scalar_one()

        return {
            "repo_id": str(repo.id),
            "created": True  # PostgreSQL upsert doesn't tell us if it was an insert or update
        }

    async def _upsert_starred_repo(
        self,
        session,
        user_id: str,
        repo_id: str,
        starred_at: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Insert or update starred repository relationship

        Args:
            session: Database session
            user_id: User UUID
            repo_id: Repository UUID
            starred_at: When the repo was starred (from GitHub)

        Returns:
            Dictionary with created flag
        """
        # Parse starred_at timestamp
        if starred_at:
            try:
                starred_timestamp = datetime.fromisoformat(starred_at.replace("Z", "+00:00")).replace(tzinfo=None)
            except:
                starred_timestamp = datetime.utcnow()
        else:
            starred_timestamp = datetime.utcnow()

        # Upsert starred repository
        stmt = insert(StarredRepository).values(
            user_id=user_id,
            repository_id=repo_id,
            starred_at=starred_timestamp,
            synced_at=datetime.utcnow()
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["user_id", "repository_id"],
            set_={
                "synced_at": datetime.utcnow()
            }
        )

        await session.execute(stmt)

        return {
            "created": True
        }

    async def get_sync_status(self, user_id: str) -> Dict[str, Any]:
        """
        Get sync status for a user

        Args:
            user_id: UUID of the user

        Returns:
            Dictionary with sync status info
        """
        async with AsyncSessionLocal() as session:
            # Get count of starred repos
            stmt = select(StarredRepository).where(StarredRepository.user_id == user_id)
            result = await session.execute(stmt)
            starred_repos = result.scalars().all()

            # Get last sync time
            last_sync = None
            if starred_repos:
                synced_repos = [sr for sr in starred_repos if sr.synced_at]
                if synced_repos:
                    last_sync = max(sr.synced_at for sr in synced_repos)

            return {
                "total_starred": len(starred_repos),
                "last_sync_at": last_sync.isoformat() if last_sync else None,
                "has_synced": last_sync is not None
            }


# Singleton instance
_sync_service: Optional[GitHubSyncService] = None


def get_sync_service() -> GitHubSyncService:
    """Get or create GitHubSyncService singleton"""
    global _sync_service
    if _sync_service is None:
        _sync_service = GitHubSyncService()
    return _sync_service
