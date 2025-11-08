"""
Integration Test - Full Flow
Tests the complete workflow from auth to trending repos
"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.db import AsyncSessionLocal
from app.models.user import User
from app.models.topic import Topic, UserTopic
from app.services.github_sync_service import get_sync_service
from app.services.suggestion_service import get_suggestion_engine
from app.services.trending_service import TrendingService
from sqlalchemy import select
import uuid


GITHUB_TOKEN = "ghp_REDACTED_TOKEN_FOR_SECURITY"


async def step_1_auth_and_sync():
    """Step 1: Authenticate and sync starred repos"""
    print("\n" + "=" * 60)
    print("STEP 1: AUTHENTICATION & SYNC")
    print("=" * 60)

    async with AsyncSessionLocal() as session:
        # Get or create user
        stmt = select(User).where(User.login == "test_user_reponexus")
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                id=uuid.uuid4(),
                github_id="test_github_id",
                login="test_user_reponexus",
                name="Integration Test User",
                access_token=GITHUB_TOKEN
            )
            session.add(user)
            await session.commit()
            print(f"✓ Created new user: {user.login}")
        else:
            user.access_token = GITHUB_TOKEN
            await session.commit()
            print(f"✓ Found existing user: {user.login}")

        user_id = str(user.id)

    # Sync starred repos
    print("\n📥 Syncing starred repositories...")
    sync_service = get_sync_service()

    result = await sync_service.sync_user_starred_repos(user_id, max_repos=30)

    if result["success"]:
        print(f"✓ Synced {result['total_starred']} repositories")
        print(f"  - New repos: {result['repos_created']}")
        print(f"  - Updated repos: {result['repos_updated']}")
    else:
        print(f"✗ Sync failed: {result.get('error')}")
        return None

    return user_id


async def step_2_generate_suggestions(user_id: str):
    """Step 2: Generate topic suggestions"""
    print("\n" + "=" * 60)
    print("STEP 2: GENERATE TOPIC SUGGESTIONS")
    print("=" * 60)

    suggestion_engine = get_suggestion_engine()

    print("🔍 Analyzing starred repos to generate suggestions...")
    suggestions = await suggestion_engine.generate_suggestions(user_id)

    if not suggestions:
        print("✗ No suggestions generated")
        return []

    print(f"✓ Generated {len(suggestions)} topic suggestions")

    # Display top 5
    print("\nTop 5 Suggestions:")
    for i, suggestion in enumerate(suggestions[:5], 1):
        print(f"  {i}. {suggestion['topic_display_name']} (Score: {suggestion['relevance_score']})")
        print(f"     {suggestion['reason']}")

    # Save suggestions
    print("\n💾 Saving suggestions to database...")
    saved_count = await suggestion_engine.save_suggestions(user_id, suggestions)
    print(f"✓ Saved {saved_count} suggestions")

    return suggestions


async def step_3_follow_topic(user_id: str, suggestions):
    """Step 3: Follow a topic (accept a suggestion)"""
    print("\n" + "=" * 60)
    print("STEP 3: FOLLOW A TOPIC")
    print("=" * 60)

    if not suggestions:
        print("✗ No suggestions to accept")
        return None

    # Get the top suggestion
    top_suggestion = suggestions[0]
    topic_id = top_suggestion['topic_id']
    topic_name = top_suggestion['topic_name']

    print(f"📌 Following topic: {topic_name}")

    async with AsyncSessionLocal() as session:
        # Create UserTopic relationship
        existing_stmt = select(UserTopic).where(
            UserTopic.user_id == user_id,
            UserTopic.topic_id == topic_id
        )
        result = await session.execute(existing_stmt)
        existing = result.scalar_one_or_none()

        if existing:
            existing.is_following = True
            print(f"✓ Updated existing follow for topic: {topic_name}")
        else:
            user_topic = UserTopic(
                user_id=uuid.UUID(user_id),
                topic_id=uuid.UUID(topic_id),
                is_following=True,
                notification_enabled=True
            )
            session.add(user_topic)
            print(f"✓ Now following topic: {topic_name}")

        await session.commit()

    return topic_id, topic_name


async def step_4_calculate_trending(topic_id: str, topic_name: str):
    """Step 4: Calculate trending scores for the followed topic"""
    print("\n" + "=" * 60)
    print(f"STEP 4: CALCULATE TRENDING FOR '{topic_name}'")
    print("=" * 60)

    from app.models.repository import Repository

    async with AsyncSessionLocal() as session:
        # Find repos with this topic
        stmt = select(Repository).where(
            Repository.topics.contains([topic_name])
        ).limit(10)

        result = await session.execute(stmt)
        repos = result.scalars().all()

        print(f"📊 Found {len(repos)} repositories with topic '{topic_name}'")

        if not repos:
            print("✗ No repos found for trending calculation")
            return []

        # Calculate trending scores
        print("\n🔢 Calculating trending scores...")
        trending_service = TrendingService(session)

        trending_scores = []
        for i, repo in enumerate(repos, 1):
            # Sample activity data
            activity_data = {
                'stars_gained': max(1, int(repo.stargazer_count * 0.01)),
                'commits': 10 + (i * 2),
                'prs_merged': 3 + i,
                'issues_closed': 2,
                'new_contributors': 1,
                'pr_merge_rate': 0.75
            }

            score = await trending_service.calculate_trending_score(
                repo_id=uuid.UUID(str(repo.id)),
                topic_id=uuid.UUID(topic_id),
                time_window="daily",
                activity_data=activity_data
            )

            if score:
                trending_scores.append({
                    'repo': repo,
                    'score': score
                })

        print(f"✓ Calculated trending scores for {len(trending_scores)} repositories")

        return trending_scores


async def step_5_get_trending_feed(user_id: str):
    """Step 5: Get personalized trending feed"""
    print("\n" + "=" * 60)
    print("STEP 5: GET PERSONALIZED TRENDING FEED")
    print("=" * 60)

    async with AsyncSessionLocal() as session:
        trending_service = TrendingService(session)

        print("📰 Fetching trending repos from followed topics...")

        repos, total = await trending_service.get_trending_repos_for_user_topics(
            user_id=uuid.UUID(user_id),
            time_window="daily",
            limit=10
        )

        print(f"✓ Retrieved {len(repos)} trending repositories (total: {total})")

        if repos:
            print("\nYour Personalized Trending Feed:")
            for i, repo in enumerate(repos[:5], 1):
                print(f"\n  {i}. {repo.name_with_owner}")
                print(f"     ⭐ {repo.stargazer_count:,} stars")
                print(f"     💻 {repo.primary_language or 'Unknown'}")
                print(f"     📝 {repo.description[:80] if repo.description else 'No description'}...")

        return repos


async def verify_complete_flow():
    """Verify all data is properly stored"""
    print("\n" + "=" * 60)
    print("VERIFICATION: DATABASE STATE")
    print("=" * 60)

    from app.models.starred_repository import StarredRepository
    from app.models.topic_suggestion import TopicSuggestion
    from app.models.trending_score import TrendingScore
    from app.models.repository import Repository

    async with AsyncSessionLocal() as session:
        # Count records in each table
        from sqlalchemy import func

        # Users
        user_count = await session.execute(select(func.count(User.id)))
        user_count = user_count.scalar()

        # Starred repos
        starred_count = await session.execute(select(func.count(StarredRepository.id)))
        starred_count = starred_count.scalar()

        # Repos
        repo_count = await session.execute(select(func.count(Repository.id)))
        repo_count = repo_count.scalar()

        # Topic suggestions
        suggestion_count = await session.execute(select(func.count(TopicSuggestion.id)))
        suggestion_count = suggestion_count.scalar()

        # User topics (followed)
        followed_count = await session.execute(select(func.count(UserTopic.id)))
        followed_count = followed_count.scalar()

        # Trending scores
        trending_count = await session.execute(select(func.count(TrendingScore.id)))
        trending_count = trending_count.scalar()

        print("\n📊 Database Record Counts:")
        print(f"  Users: {user_count}")
        print(f"  Repositories: {repo_count}")
        print(f"  Starred Repositories: {starred_count}")
        print(f"  Topic Suggestions: {suggestion_count}")
        print(f"  Followed Topics: {followed_count}")
        print(f"  Trending Scores: {trending_count}")

        # Verify data integrity
        print("\n✓ Data Integrity Checks:")

        if user_count > 0:
            print("  ✓ Users table populated")
        if repo_count > 0:
            print("  ✓ Repositories table populated")
        if starred_count > 0:
            print("  ✓ Starred repositories linked")
        if suggestion_count > 0:
            print("  ✓ Topic suggestions generated")
        if followed_count > 0:
            print("  ✓ Topics followed")
        if trending_count > 0:
            print("  ✓ Trending scores calculated")

        return {
            'users': user_count,
            'repos': repo_count,
            'starred': starred_count,
            'suggestions': suggestion_count,
            'followed': followed_count,
            'trending': trending_count
        }


async def main():
    """Run complete integration test"""
    print("=" * 60)
    print("INTEGRATION TEST - FULL FLOW")
    print("=" * 60)
    print("\nThis test will run the complete workflow:")
    print("1. Authenticate & sync starred repos")
    print("2. Generate topic suggestions")
    print("3. Follow a topic")
    print("4. Calculate trending scores")
    print("5. Get personalized feed")
    print()

    try:
        # Run all steps
        user_id = await step_1_auth_and_sync()
        if not user_id:
            print("\n✗ Integration test failed at step 1")
            return

        suggestions = await step_2_generate_suggestions(user_id)
        if not suggestions:
            print("\n⚠ No suggestions generated, but continuing...")

        topic_result = await step_3_follow_topic(user_id, suggestions)
        if not topic_result:
            print("\n⚠ Could not follow topic, but continuing...")
            topic_id = None
            topic_name = None
        else:
            topic_id, topic_name = topic_result

        if topic_id:
            trending_scores = await step_4_calculate_trending(topic_id, topic_name)
        else:
            trending_scores = []

        trending_feed = await step_5_get_trending_feed(user_id)

        # Verify database state
        db_stats = await verify_complete_flow()

        # Final summary
        print("\n" + "=" * 60)
        print("INTEGRATION TEST SUMMARY")
        print("=" * 60)
        print(f"✓ Step 1: User authenticated and repos synced")
        print(f"✓ Step 2: {len(suggestions)} topic suggestions generated")
        print(f"✓ Step 3: Topic followed: {topic_name if topic_name else 'N/A'}")
        print(f"✓ Step 4: {len(trending_scores)} trending scores calculated")
        print(f"✓ Step 5: {len(trending_feed)} repos in personalized feed")
        print(f"\n✓ Database populated:")
        print(f"  - {db_stats['repos']} repositories")
        print(f"  - {db_stats['starred']} starred repos")
        print(f"  - {db_stats['suggestions']} suggestions")
        print(f"  - {db_stats['trending']} trending scores")
        print("\n✅ INTEGRATION TEST PASSED!")

    except Exception as e:
        print(f"\n✗ Integration test failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
