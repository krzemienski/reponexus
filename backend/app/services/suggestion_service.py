"""
Topic Suggestion Service
Analyzes user's starred repositories to suggest topics they're not following
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy import select, and_, func
from sqlalchemy.orm import joinedload
from collections import Counter

from app.core.db import AsyncSessionLocal
from app.models.user import User
from app.models.repository import Repository
from app.models.topic import Topic, UserTopic
from app.models.topic_suggestion import TopicSuggestion
from app.models.starred_repository import StarredRepository

logger = logging.getLogger(__name__)


class TopicSuggestionEngine:
    """
    Engine for generating topic suggestions based on user's starred repositories
    """

    def __init__(self):
        self.min_starred_count = 2  # Minimum starred repos to suggest a topic
        self.max_suggestions = 15  # Maximum suggestions to generate

    async def generate_suggestions(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Generate topic suggestions for a user

        Algorithm:
        1. Get all starred repos for the user
        2. Extract topics from those repos
        3. Count frequency per topic
        4. Filter out already-followed topics
        5. Calculate relevance score (0-100)
        6. Generate human-readable reason
        7. Return top suggestions

        Args:
            user_id: UUID of the user

        Returns:
            List of suggestion dictionaries with topic info, score, reason, examples
        """
        logger.info(f"Generating topic suggestions for user {user_id}")

        async with AsyncSessionLocal() as session:
            # Get user with followed topics
            stmt = select(User).where(User.id == user_id).options(
                joinedload(User.followed_topics).joinedload(UserTopic.topic)
            )
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()

            if not user:
                logger.error(f"User not found: {user_id}")
                return []

            # Get already followed topic names
            followed_topic_names = {
                ut.topic.name for ut in user.followed_topics
                if ut.is_following
            }

            logger.info(f"User follows {len(followed_topic_names)} topics")

            # Get user's starred repositories with repository data
            stmt = select(StarredRepository).where(
                StarredRepository.user_id == user_id
            ).options(joinedload(StarredRepository.repository))
            result = await session.execute(stmt)
            starred_repos = result.scalars().all()

            logger.info(f"User has starred {len(starred_repos)} repositories")

            if len(starred_repos) == 0:
                logger.warning("User has no starred repositories")
                return []

            # Extract topics from starred repos and count frequency
            topic_data = {}  # {topic_name: {"count": N, "repos": [repo_objs]}}

            for starred_repo in starred_repos:
                repo = starred_repo.repository
                if not repo or not repo.topics:
                    continue

                for topic_name in repo.topics:
                    # Skip already followed topics
                    if topic_name in followed_topic_names:
                        continue

                    if topic_name not in topic_data:
                        topic_data[topic_name] = {
                            "count": 0,
                            "repos": []
                        }

                    topic_data[topic_name]["count"] += 1
                    topic_data[topic_name]["repos"].append(repo)

            logger.info(f"Found {len(topic_data)} unique unfollowed topics")

            # Filter topics with minimum starred count
            filtered_topics = {
                name: data for name, data in topic_data.items()
                if data["count"] >= self.min_starred_count
            }

            logger.info(f"{len(filtered_topics)} topics meet minimum threshold")

            if len(filtered_topics) == 0:
                logger.warning("No topics meet minimum threshold")
                return []

            # Calculate relevance scores and sort
            scored_topics = []
            total_starred = len(starred_repos)

            for topic_name, data in filtered_topics.items():
                count = data["count"]

                # Calculate relevance score (0-100)
                # Based on: frequency, percentage of total stars
                frequency_score = min(count * 10, 50)  # Max 50 from frequency
                percentage = (count / total_starred) * 100
                percentage_score = min(percentage * 5, 50)  # Max 50 from percentage

                relevance_score = int(frequency_score + percentage_score)

                scored_topics.append({
                    "topic_name": topic_name,
                    "count": count,
                    "score": relevance_score,
                    "repos": data["repos"]
                })

            # Sort by score (descending)
            scored_topics.sort(key=lambda x: x["score"], reverse=True)

            # Take top N suggestions
            top_suggestions = scored_topics[:self.max_suggestions]

            logger.info(f"Generated {len(top_suggestions)} suggestions")

            # Get or create Topic objects for each suggestion
            suggestions = []

            for suggestion_data in top_suggestions:
                topic_name = suggestion_data["topic_name"]
                count = suggestion_data["count"]
                score = suggestion_data["score"]
                repos = suggestion_data["repos"]

                # Get or create topic in database
                stmt = select(Topic).where(Topic.name == topic_name)
                result = await session.execute(stmt)
                topic = result.scalar_one_or_none()

                if not topic:
                    # Create new topic
                    topic = Topic(
                        name=topic_name,
                        display_name=topic_name.replace("-", " ").title(),
                        description=f"Topic: {topic_name}"
                    )
                    session.add(topic)
                    await session.flush()

                # Generate reason
                reason = self._generate_reason(count, total_starred)

                # Get example repos (top 3 by stars)
                example_repos = sorted(
                    repos[:10],  # Consider top 10
                    key=lambda r: r.stargazer_count,
                    reverse=True
                )[:3]

                suggestions.append({
                    "topic_id": str(topic.id),
                    "topic_name": topic.name,
                    "topic_display_name": topic.display_name,
                    "relevance_score": score,
                    "starred_repo_count": count,
                    "reason": reason,
                    "example_repos": [
                        {
                            "id": str(repo.id),
                            "name_with_owner": repo.name_with_owner,
                            "description": repo.description,
                            "stargazer_count": repo.stargazer_count,
                            "primary_language": repo.primary_language,
                        }
                        for repo in example_repos
                    ]
                })

            await session.commit()

            return suggestions

    async def save_suggestions(
        self,
        user_id: str,
        suggestions: List[Dict[str, Any]]
    ) -> int:
        """
        Save generated suggestions to database

        Args:
            user_id: UUID of the user
            suggestions: List of suggestion dictionaries

        Returns:
            Number of suggestions saved
        """
        logger.info(f"Saving {len(suggestions)} suggestions for user {user_id}")

        async with AsyncSessionLocal() as session:
            saved_count = 0

            for suggestion in suggestions:
                # Check if suggestion already exists
                stmt = select(TopicSuggestion).where(
                    and_(
                        TopicSuggestion.user_id == user_id,
                        TopicSuggestion.topic_id == suggestion["topic_id"],
                        TopicSuggestion.is_dismissed == False
                    )
                )
                result = await session.execute(stmt)
                existing = result.scalar_one_or_none()

                if existing:
                    # Update existing suggestion
                    existing.relevance_score = suggestion["relevance_score"]
                    existing.starred_repo_count = suggestion["starred_repo_count"]
                    existing.reason = suggestion["reason"]
                    existing.suggested_at = datetime.utcnow()
                    saved_count += 1
                else:
                    # Create new suggestion
                    new_suggestion = TopicSuggestion(
                        user_id=user_id,
                        topic_id=suggestion["topic_id"],
                        relevance_score=suggestion["relevance_score"],
                        starred_repo_count=suggestion["starred_repo_count"],
                        reason=suggestion["reason"],
                        is_dismissed=False,
                        is_accepted=False,
                        suggested_at=datetime.utcnow()
                    )
                    session.add(new_suggestion)
                    saved_count += 1

            await session.commit()

            logger.info(f"Saved {saved_count} suggestions")
            return saved_count

    async def get_suggestions(
        self,
        user_id: str,
        include_dismissed: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get saved suggestions for a user

        Args:
            user_id: UUID of the user
            include_dismissed: Whether to include dismissed suggestions

        Returns:
            List of suggestion dictionaries
        """
        async with AsyncSessionLocal() as session:
            stmt = select(TopicSuggestion).where(
                TopicSuggestion.user_id == user_id
            ).options(
                joinedload(TopicSuggestion.topic)
            ).order_by(TopicSuggestion.relevance_score.desc())

            if not include_dismissed:
                stmt = stmt.where(
                    and_(
                        TopicSuggestion.is_dismissed == False,
                        TopicSuggestion.is_accepted == False
                    )
                )

            result = await session.execute(stmt)
            suggestions = result.scalars().all()

            return [
                {
                    "id": str(s.id),
                    "topic_id": str(s.topic_id),
                    "topic_name": s.topic.name,
                    "topic_display_name": s.topic.display_name,
                    "relevance_score": s.relevance_score,
                    "starred_repo_count": s.starred_repo_count,
                    "reason": s.reason,
                    "is_dismissed": s.is_dismissed,
                    "is_accepted": s.is_accepted,
                    "suggested_at": s.suggested_at.isoformat() if s.suggested_at else None,
                }
                for s in suggestions
            ]

    async def dismiss_suggestion(self, suggestion_id: str) -> bool:
        """
        Mark a suggestion as dismissed

        Args:
            suggestion_id: UUID of the suggestion

        Returns:
            True if successful
        """
        async with AsyncSessionLocal() as session:
            stmt = select(TopicSuggestion).where(TopicSuggestion.id == suggestion_id)
            result = await session.execute(stmt)
            suggestion = result.scalar_one_or_none()

            if not suggestion:
                logger.error(f"Suggestion not found: {suggestion_id}")
                return False

            suggestion.is_dismissed = True
            suggestion.dismissed_at = datetime.utcnow()
            await session.commit()

            logger.info(f"Dismissed suggestion {suggestion_id}")
            return True

    async def accept_suggestion(self, suggestion_id: str) -> bool:
        """
        Mark a suggestion as accepted and follow the topic

        Args:
            suggestion_id: UUID of the suggestion

        Returns:
            True if successful
        """
        async with AsyncSessionLocal() as session:
            stmt = select(TopicSuggestion).where(
                TopicSuggestion.id == suggestion_id
            ).options(joinedload(TopicSuggestion.topic))
            result = await session.execute(stmt)
            suggestion = result.scalar_one_or_none()

            if not suggestion:
                logger.error(f"Suggestion not found: {suggestion_id}")
                return False

            # Mark as accepted
            suggestion.is_accepted = True
            suggestion.accepted_at = datetime.utcnow()

            # Create UserTopic relationship
            existing_stmt = select(UserTopic).where(
                and_(
                    UserTopic.user_id == suggestion.user_id,
                    UserTopic.topic_id == suggestion.topic_id
                )
            )
            result = await session.execute(existing_stmt)
            existing_follow = result.scalar_one_or_none()

            if existing_follow:
                existing_follow.is_following = True
            else:
                user_topic = UserTopic(
                    user_id=suggestion.user_id,
                    topic_id=suggestion.topic_id,
                    is_following=True,
                    notification_enabled=True
                )
                session.add(user_topic)

            await session.commit()

            logger.info(f"Accepted suggestion {suggestion_id}, now following topic")
            return True

    def _generate_reason(self, count: int, total: int) -> str:
        """
        Generate a human-readable reason for the suggestion

        Args:
            count: Number of starred repos with this topic
            total: Total number of starred repos

        Returns:
            Reason string
        """
        percentage = (count / total) * 100

        if count == 1:
            return f"You've starred 1 repository with this topic"
        elif percentage > 50:
            return f"You've starred {count} repositories with this topic - over half of your stars!"
        elif percentage > 25:
            return f"You've starred {count} repositories with this topic - a significant portion of your interests"
        else:
            return f"You've starred {count} repositories with this topic"


# Singleton instance
_suggestion_engine: Optional[TopicSuggestionEngine] = None


def get_suggestion_engine() -> TopicSuggestionEngine:
    """Get or create TopicSuggestionEngine singleton"""
    global _suggestion_engine
    if _suggestion_engine is None:
        _suggestion_engine = TopicSuggestionEngine()
    return _suggestion_engine
