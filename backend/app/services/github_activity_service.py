"""
GitHub Activity Service - Fetches repository activity metrics from GitHub API
Provides data for trending score calculations
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.repository import Repository
from app.services.github_service import get_github_service
from app.services.cache_service import get_cache_service

logger = logging.getLogger(__name__)


class GitHubActivityService:
    """
    Service for fetching GitHub repository activity metrics
    """

    def __init__(self, session: AsyncSession):
        self.session = session
        self.github = get_github_service()
        self.cache = get_cache_service()

    async def fetch_repo_activity(
        self,
        repo_id: UUID,
        days: int = 7
    ) -> Optional[Dict[str, Any]]:
        """
        Fetch repository activity metrics for the specified time window

        Args:
            repo_id: Repository UUID
            days: Number of days to look back

        Returns:
            Dictionary with activity metrics or None if fetch failed
        """
        try:
            # Get repository from database
            stmt = select(Repository).where(Repository.id == repo_id)
            result = await self.session.execute(stmt)
            repo = result.scalar_one_or_none()

            if not repo:
                logger.warning(f"Repository {repo_id} not found")
                return None

            # Check cache first
            cache_key = f"activity:{repo.name_with_owner}:{days}d"
            cached_data = await self.cache.get(cache_key)

            if cached_data:
                logger.debug(f"Using cached activity data for {repo.name_with_owner}")
                return cached_data

            # Fetch from GitHub
            activity_data = await self._fetch_from_github(repo, days)

            # Cache for 15 minutes
            if activity_data:
                await self.cache.set(cache_key, activity_data, ttl=900)

            return activity_data

        except Exception as e:
            logger.error(f"Error fetching repo activity for {repo_id}: {e}")
            return None

    async def _fetch_from_github(
        self,
        repo: Repository,
        days: int
    ) -> Dict[str, Any]:
        """
        Fetch activity metrics from GitHub API

        Args:
            repo: Repository model
            days: Number of days to look back

        Returns:
            Dictionary with activity metrics
        """
        try:
            owner, name = repo.name_with_owner.split('/')
            since_date = datetime.utcnow() - timedelta(days=days)

            # Initialize activity data
            activity_data = {
                'stars_gained': 0,
                'commits': 0,
                'prs_merged': 0,
                'issues_closed': 0,
                'new_contributors': 0,
                'pr_merge_rate': 0.0,
                'fetched_at': datetime.utcnow().isoformat()
            }

            # Fetch commits count
            commits_count = await self._fetch_commits_count(owner, name, since_date)
            activity_data['commits'] = commits_count

            # Fetch PRs data
            prs_data = await self._fetch_prs_data(owner, name, since_date)
            activity_data['prs_merged'] = prs_data['merged']
            activity_data['pr_merge_rate'] = prs_data['merge_rate']

            # Fetch issues data
            issues_closed = await self._fetch_issues_closed(owner, name, since_date)
            activity_data['issues_closed'] = issues_closed

            # Fetch contributors data
            new_contributors = await self._fetch_new_contributors(owner, name, since_date)
            activity_data['new_contributors'] = new_contributors

            # Estimate stars gained (current - historical)
            # Note: GitHub doesn't provide historical star data easily
            # This is a simplified estimation
            activity_data['stars_gained'] = await self._estimate_stars_gained(repo, days)

            logger.info(f"Fetched activity for {repo.name_with_owner}: {activity_data}")

            return activity_data

        except Exception as e:
            logger.error(f"Error fetching from GitHub for {repo.name_with_owner}: {e}")
            # Return default values on error
            return {
                'stars_gained': 0,
                'commits': 0,
                'prs_merged': 0,
                'issues_closed': 0,
                'new_contributors': 0,
                'pr_merge_rate': 0.0,
                'fetched_at': datetime.utcnow().isoformat()
            }

    async def _fetch_commits_count(
        self,
        owner: str,
        name: str,
        since: datetime
    ) -> int:
        """
        Fetch number of commits since specified date

        Uses GitHub GraphQL API to get commit count
        """
        try:
            query = """
            query($owner: String!, $name: String!, $since: GitTimestamp!) {
              repository(owner: $owner, name: $name) {
                defaultBranchRef {
                  target {
                    ... on Commit {
                      history(since: $since) {
                        totalCount
                      }
                    }
                  }
                }
              }
            }
            """

            variables = {
                'owner': owner,
                'name': name,
                'since': since.isoformat()
            }

            result = await self.github.execute_graphql(query, variables)

            if result and 'data' in result:
                history = result['data']['repository']['defaultBranchRef']['target']['history']
                return history['totalCount']

            return 0

        except Exception as e:
            logger.warning(f"Error fetching commits count for {owner}/{name}: {e}")
            return 0

    async def _fetch_prs_data(
        self,
        owner: str,
        name: str,
        since: datetime
    ) -> Dict[str, Any]:
        """
        Fetch pull request data (merged count and merge rate)
        """
        try:
            query = """
            query($owner: String!, $name: String!, $since: DateTime!) {
              repository(owner: $owner, name: $name) {
                pullRequests(first: 100, states: [MERGED, CLOSED], orderBy: {field: UPDATED_AT, direction: DESC}) {
                  nodes {
                    state
                    mergedAt
                    closedAt
                  }
                }
              }
            }
            """

            variables = {
                'owner': owner,
                'name': name,
                'since': since.isoformat()
            }

            result = await self.github.execute_graphql(query, variables)

            if not result or 'data' not in result:
                return {'merged': 0, 'merge_rate': 0.0}

            prs = result['data']['repository']['pullRequests']['nodes']

            # Filter PRs updated since date
            merged_count = 0
            total_count = 0

            for pr in prs:
                merged_at = pr.get('mergedAt')
                closed_at = pr.get('closedAt')

                if merged_at:
                    merged_date = datetime.fromisoformat(merged_at.replace('Z', '+00:00'))
                    if merged_date >= since:
                        merged_count += 1
                        total_count += 1
                elif closed_at:
                    closed_date = datetime.fromisoformat(closed_at.replace('Z', '+00:00'))
                    if closed_date >= since:
                        total_count += 1

            # Calculate merge rate
            merge_rate = merged_count / total_count if total_count > 0 else 0.0

            return {
                'merged': merged_count,
                'merge_rate': merge_rate
            }

        except Exception as e:
            logger.warning(f"Error fetching PRs data for {owner}/{name}: {e}")
            return {'merged': 0, 'merge_rate': 0.0}

    async def _fetch_issues_closed(
        self,
        owner: str,
        name: str,
        since: datetime
    ) -> int:
        """
        Fetch number of issues closed since specified date
        """
        try:
            query = """
            query($owner: String!, $name: String!) {
              repository(owner: $owner, name: $name) {
                issues(first: 100, states: [CLOSED], orderBy: {field: UPDATED_AT, direction: DESC}) {
                  nodes {
                    closedAt
                  }
                }
              }
            }
            """

            variables = {
                'owner': owner,
                'name': name
            }

            result = await self.github.execute_graphql(query, variables)

            if not result or 'data' not in result:
                return 0

            issues = result['data']['repository']['issues']['nodes']

            # Count issues closed since date
            closed_count = 0
            for issue in issues:
                closed_at = issue.get('closedAt')
                if closed_at:
                    closed_date = datetime.fromisoformat(closed_at.replace('Z', '+00:00'))
                    if closed_date >= since:
                        closed_count += 1

            return closed_count

        except Exception as e:
            logger.warning(f"Error fetching issues closed for {owner}/{name}: {e}")
            return 0

    async def _fetch_new_contributors(
        self,
        owner: str,
        name: str,
        since: datetime
    ) -> int:
        """
        Fetch number of new contributors since specified date
        Note: This is a simplified implementation
        """
        try:
            # In a real implementation, we would track contributor join dates
            # For now, we'll use a heuristic based on recent commit authors

            query = """
            query($owner: String!, $name: String!) {
              repository(owner: $owner, name: $name) {
                mentionableUsers(first: 100) {
                  totalCount
                }
              }
            }
            """

            variables = {
                'owner': owner,
                'name': name
            }

            result = await self.github.execute_graphql(query, variables)

            # Simplified: assume 5% growth in contributors
            # In production, track actual new contributors
            return 1 if result else 0

        except Exception as e:
            logger.warning(f"Error fetching new contributors for {owner}/{name}: {e}")
            return 0

    async def _estimate_stars_gained(
        self,
        repo: Repository,
        days: int
    ) -> int:
        """
        Estimate stars gained in the time window
        This is a simplified estimation based on current star count

        In production, you would:
        1. Track historical star counts in the database
        2. Use GitHub's star history API if available
        3. Use third-party services like StarTrack
        """
        try:
            # Check if we have historical star count data
            # For now, estimate based on repository age and current stars

            if not repo.created_at:
                return 0

            # Calculate repository age in days
            repo_age_days = (datetime.utcnow() - repo.created_at).days

            if repo_age_days == 0:
                return 0

            # Estimate daily star rate
            daily_star_rate = repo.stargazer_count / repo_age_days

            # Estimate stars gained in the window
            estimated_stars = int(daily_star_rate * days)

            # Apply a recency bias (newer repos tend to gain stars faster)
            if repo_age_days < 30:
                estimated_stars = int(estimated_stars * 1.5)
            elif repo_age_days < 90:
                estimated_stars = int(estimated_stars * 1.2)

            return max(0, min(estimated_stars, repo.stargazer_count))

        except Exception as e:
            logger.warning(f"Error estimating stars gained for {repo.name_with_owner}: {e}")
            return 0

    async def batch_fetch_activity(
        self,
        repo_ids: list[UUID],
        days: int = 7
    ) -> Dict[UUID, Dict[str, Any]]:
        """
        Fetch activity data for multiple repositories in batch

        Args:
            repo_ids: List of repository UUIDs
            days: Number of days to look back

        Returns:
            Dictionary mapping repo_id to activity data
        """
        results = {}

        for repo_id in repo_ids:
            try:
                activity_data = await self.fetch_repo_activity(repo_id, days)
                if activity_data:
                    results[repo_id] = activity_data
            except Exception as e:
                logger.error(f"Error fetching activity for repo {repo_id}: {e}")
                continue

        return results


# Factory function
def get_github_activity_service(session: AsyncSession) -> GitHubActivityService:
    """Get GitHub activity service instance"""
    return GitHubActivityService(session)
