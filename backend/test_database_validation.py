"""
Database Validation Script
Validates database state after running tests
"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.db import AsyncSessionLocal
from app.models.user import User
from app.models.repository import Repository
from app.models.starred_repository import StarredRepository
from app.models.topic import Topic, UserTopic
from app.models.topic_suggestion import TopicSuggestion
from app.models.trending_score import TrendingScore
from sqlalchemy import select, func


async def validate_table(model, table_name: str):
    """Validate a table and return count"""
    print(f"\n=== {table_name} ===")

    async with AsyncSessionLocal() as session:
        # Get count
        stmt = select(func.count(model.id))
        result = await session.execute(stmt)
        count = result.scalar()

        print(f"Total Records: {count:,}")

        if count == 0:
            print("⚠ Table is empty")
            return 0

        # Get sample records
        stmt = select(model).limit(3)
        result = await session.execute(stmt)
        samples = result.scalars().all()

        print(f"\nSample Records (first 3):")
        for i, record in enumerate(samples, 1):
            print(f"  {i}. ID: {record.id}")
            if hasattr(record, 'created_at'):
                print(f"     Created: {record.created_at}")

        return count


async def validate_users():
    """Validate users table"""
    count = await validate_table(User, "Users")

    async with AsyncSessionLocal() as session:
        # Get user details
        stmt = select(User)
        result = await session.execute(stmt)
        users = result.scalars().all()

        for user in users[:5]:
            print(f"\n  User: {user.login}")
            print(f"    GitHub ID: {user.github_id}")
            print(f"    Has Token: {'Yes' if user.access_token else 'No'}")
            print(f"    Created: {user.created_at}")

    return count


async def validate_repositories():
    """Validate repositories table"""
    count = await validate_table(Repository, "Repositories")

    async with AsyncSessionLocal() as session:
        # Get top repos by stars
        stmt = select(Repository).order_by(Repository.stargazer_count.desc()).limit(5)
        result = await session.execute(stmt)
        top_repos = result.scalars().all()

        print("\nTop 5 Repos by Stars:")
        for i, repo in enumerate(top_repos, 1):
            print(f"\n  {i}. {repo.name_with_owner}")
            print(f"     Stars: {repo.stargazer_count:,}")
            print(f"     Language: {repo.primary_language or 'N/A'}")
            print(f"     Topics: {len(repo.topics) if repo.topics else 0}")

        # Language distribution
        stmt = select(Repository.primary_language, func.count(Repository.id)).group_by(
            Repository.primary_language
        ).order_by(func.count(Repository.id).desc()).limit(5)
        result = await session.execute(stmt)
        lang_dist = result.all()

        print("\nTop 5 Languages:")
        for lang, count in lang_dist:
            print(f"  {lang or 'Unknown'}: {count} repos")

    return count


async def validate_starred_repositories():
    """Validate starred repositories"""
    count = await validate_table(StarredRepository, "Starred Repositories")

    async with AsyncSessionLocal() as session:
        # Get user with most stars
        stmt = select(
            StarredRepository.user_id,
            func.count(StarredRepository.id).label('star_count')
        ).group_by(StarredRepository.user_id).order_by(
            func.count(StarredRepository.id).desc()
        ).limit(5)
        result = await session.execute(stmt)
        user_stars = result.all()

        print("\nUsers with Most Stars:")
        for user_id, star_count in user_stars:
            user_stmt = select(User).where(User.id == user_id)
            user_result = await session.execute(user_stmt)
            user = user_result.scalar_one_or_none()

            print(f"  {user.login if user else 'Unknown'}: {star_count} stars")

    return count


async def validate_topics():
    """Validate topics table"""
    count = await validate_table(Topic, "Topics")

    async with AsyncSessionLocal() as session:
        # Get sample topics
        stmt = select(Topic).limit(10)
        result = await session.execute(stmt)
        topics = result.scalars().all()

        print("\nSample Topics:")
        for topic in topics:
            print(f"  - {topic.name} ({topic.display_name})")

    return count


async def validate_topic_suggestions():
    """Validate topic suggestions"""
    count = await validate_table(TopicSuggestion, "Topic Suggestions")

    async with AsyncSessionLocal() as session:
        # Get top suggestions by score
        stmt = select(TopicSuggestion).order_by(
            TopicSuggestion.relevance_score.desc()
        ).limit(5)
        result = await session.execute(stmt)
        suggestions = result.scalars().all()

        print("\nTop 5 Suggestions by Score:")
        for i, suggestion in enumerate(suggestions, 1):
            # Get topic
            topic_stmt = select(Topic).where(Topic.id == suggestion.topic_id)
            topic_result = await session.execute(topic_stmt)
            topic = topic_result.scalar_one_or_none()

            print(f"  {i}. {topic.name if topic else 'Unknown'}")
            print(f"     Score: {suggestion.relevance_score}/100")
            print(f"     Starred Repos: {suggestion.starred_repo_count}")
            print(f"     Dismissed: {suggestion.is_dismissed}")

    return count


async def validate_user_topics():
    """Validate user topics (followed topics)"""
    count = await validate_table(UserTopic, "User Topics (Followed)")

    async with AsyncSessionLocal() as session:
        # Get followed topics
        stmt = select(UserTopic).where(UserTopic.is_following == True).limit(10)
        result = await session.execute(stmt)
        followed = result.scalars().all()

        print("\nFollowed Topics:")
        for ut in followed:
            # Get topic
            topic_stmt = select(Topic).where(Topic.id == ut.topic_id)
            topic_result = await session.execute(topic_stmt)
            topic = topic_result.scalar_one_or_none()

            # Get user
            user_stmt = select(User).where(User.id == ut.user_id)
            user_result = await session.execute(user_stmt)
            user = user_result.scalar_one_or_none()

            print(f"  {user.login if user else 'Unknown'} -> {topic.name if topic else 'Unknown'}")

    return count


async def validate_trending_scores():
    """Validate trending scores"""
    count = await validate_table(TrendingScore, "Trending Scores")

    async with AsyncSessionLocal() as session:
        # Get top trending scores
        stmt = select(TrendingScore).order_by(
            TrendingScore.trending_score.desc()
        ).limit(10)
        result = await session.execute(stmt)
        trending = result.scalars().all()

        print("\nTop 10 Trending Scores:")
        for i, score in enumerate(trending, 1):
            # Get repo
            repo_stmt = select(Repository).where(Repository.id == score.repository_id)
            repo_result = await session.execute(repo_stmt)
            repo = repo_result.scalar_one_or_none()

            # Get topic
            topic_stmt = select(Topic).where(Topic.id == score.topic_id)
            topic_result = await session.execute(topic_stmt)
            topic = topic_result.scalar_one_or_none()

            print(f"  {i}. {repo.name_with_owner if repo else 'Unknown'}")
            print(f"     Topic: {topic.name if topic else 'Unknown'}")
            print(f"     Score: {score.trending_score:.2f}/100")
            print(f"     Window: {score.time_window}")

    return count


async def check_data_relationships():
    """Check data relationships and integrity"""
    print("\n" + "=" * 60)
    print("DATA RELATIONSHIP CHECKS")
    print("=" * 60)

    async with AsyncSessionLocal() as session:
        # Check orphaned starred repos
        stmt = select(func.count(StarredRepository.id)).where(
            StarredRepository.user_id.is_(None)
        )
        result = await session.execute(stmt)
        orphaned_stars = result.scalar()

        print(f"\n✓ Orphaned starred repos (should be 0): {orphaned_stars}")

        # Check repos without topics
        stmt = select(func.count(Repository.id)).where(
            Repository.topics == None
        )
        result = await session.execute(stmt)
        repos_no_topics = result.scalar()

        # Check empty topics array
        stmt = select(func.count(Repository.id)).where(
            Repository.topics == []
        )
        result = await session.execute(stmt)
        repos_empty_topics = result.scalar()

        total_no_topics = repos_no_topics + repos_empty_topics

        print(f"✓ Repositories without topics: {total_no_topics}")

        # Check trending scores without repos
        stmt = select(func.count(TrendingScore.id))
        result = await session.execute(stmt)
        total_scores = result.scalar()

        print(f"✓ Total trending scores: {total_scores}")


async def generate_summary_report():
    """Generate final summary report"""
    print("\n" + "=" * 60)
    print("VALIDATION SUMMARY REPORT")
    print("=" * 60)

    counts = {
        'users': await validate_users(),
        'repositories': await validate_repositories(),
        'starred': await validate_starred_repositories(),
        'topics': await validate_topics(),
        'suggestions': await validate_topic_suggestions(),
        'followed': await validate_user_topics(),
        'trending': await validate_trending_scores()
    }

    await check_data_relationships()

    print("\n" + "=" * 60)
    print("FINAL SUMMARY")
    print("=" * 60)
    print(f"\n📊 Record Counts:")
    print(f"  Users:                {counts['users']:>6,}")
    print(f"  Repositories:         {counts['repositories']:>6,}")
    print(f"  Starred Repositories: {counts['starred']:>6,}")
    print(f"  Topics:               {counts['topics']:>6,}")
    print(f"  Topic Suggestions:    {counts['suggestions']:>6,}")
    print(f"  Followed Topics:      {counts['followed']:>6,}")
    print(f"  Trending Scores:      {counts['trending']:>6,}")

    total_records = sum(counts.values())
    print(f"\n  Total Records:        {total_records:>6,}")

    # Health check
    print(f"\n✓ Database Health:")
    if counts['users'] > 0:
        print(f"  ✓ Users table populated")
    if counts['repositories'] > 0:
        print(f"  ✓ Repositories table populated")
    if counts['starred'] > 0:
        print(f"  ✓ Starred repositories linked")
    if counts['topics'] > 0:
        print(f"  ✓ Topics exist")
    if counts['suggestions'] > 0:
        print(f"  ✓ Suggestions generated")
    if counts['trending'] > 0:
        print(f"  ✓ Trending scores calculated")

    return counts


async def main():
    """Run database validation"""
    print("=" * 60)
    print("DATABASE VALIDATION")
    print("=" * 60)

    try:
        await generate_summary_report()

        print("\n✅ DATABASE VALIDATION COMPLETE!")

    except Exception as e:
        print(f"\n✗ Validation failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
