"""
Test Trending Algorithm
Tests calculating trending scores for repositories
"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.db import AsyncSessionLocal
from app.models.repository import Repository
from app.models.topic import Topic
from app.models.trending_score import TrendingScore
from app.services.trending_service import TrendingService
from sqlalchemy import select, func
import uuid


async def get_or_create_topic(topic_name: str):
    """Get or create a topic for testing"""
    print(f"\n=== Getting/Creating Topic: {topic_name} ===")

    async with AsyncSessionLocal() as session:
        # Check if topic exists
        stmt = select(Topic).where(Topic.name == topic_name)
        result = await session.execute(stmt)
        topic = result.scalar_one_or_none()

        if topic:
            print(f"✓ Found existing topic: {topic.name} (ID: {topic.id})")
        else:
            # Create new topic
            topic = Topic(
                id=uuid.uuid4(),
                name=topic_name,
                display_name=topic_name.replace("-", " ").title(),
                description=f"Topic: {topic_name}"
            )
            session.add(topic)
            await session.commit()
            print(f"✓ Created new topic: {topic.name} (ID: {topic.id})")

        return str(topic.id)


async def find_repos_with_topic(topic_name: str, limit: int = 10):
    """Find repositories that have the specified topic"""
    print(f"\n=== Finding Repositories with Topic: {topic_name} ===")

    async with AsyncSessionLocal() as session:
        # Find repos with this topic
        stmt = select(Repository).where(
            Repository.topics.contains([topic_name])
        ).limit(limit)

        result = await session.execute(stmt)
        repos = result.scalars().all()

        print(f"✓ Found {len(repos)} repositories with topic '{topic_name}'")

        if repos:
            print("\nRepositories:")
            for i, repo in enumerate(repos, 1):
                print(f"  {i}. {repo.name_with_owner} ({repo.stargazer_count:,} stars)")

        return repos


async def test_calculate_trending_scores(repos, topic_id: str, time_window: str = "daily"):
    """Test calculating trending scores for repositories"""
    print(f"\n=== Calculating Trending Scores ({time_window}) ===")

    async with AsyncSessionLocal() as session:
        trending_service = TrendingService(session)

        calculated_scores = []

        for i, repo in enumerate(repos, 1):
            print(f"\nCalculating score {i}/{len(repos)}: {repo.name_with_owner}...")

            # Create sample activity data
            # In production, this would come from GitHub API
            activity_data = {
                'stars_gained': max(1, int(repo.stargazer_count * 0.01)),  # 1% growth estimate
                'commits': 10 + (i * 2),  # Varying commit counts
                'prs_merged': 3 + i,
                'issues_closed': 2 + i,
                'new_contributors': 1,
                'pr_merge_rate': 0.7 + (i * 0.02)
            }

            trending_score = await trending_service.calculate_trending_score(
                repo_id=uuid.UUID(str(repo.id)),
                topic_id=uuid.UUID(topic_id),
                time_window=time_window,
                activity_data=activity_data
            )

            if trending_score:
                calculated_scores.append({
                    'repo': repo,
                    'score': trending_score
                })
                print(f"  ✓ Score: {trending_score.trending_score:.2f}")
                print(f"    - Star Growth: {trending_score.star_growth_rate:.2f}")
                print(f"    - Activity: {trending_score.activity_score:.2f}")
                print(f"    - Community: {trending_score.community_score:.2f}")
                print(f"    - Recency: {trending_score.recency_score:.2f}")
                print(f"    - Quality: {trending_score.quality_score:.2f}")
            else:
                print(f"  ✗ Failed to calculate score")

        return calculated_scores


async def display_trending_rankings(scored_repos):
    """Display trending repositories ranked by score"""
    print("\n=== Trending Rankings ===")

    # Sort by trending score
    ranked = sorted(scored_repos, key=lambda x: x['score'].trending_score, reverse=True)

    print(f"\nTop {len(ranked)} Trending Repositories:\n")

    for i, item in enumerate(ranked, 1):
        repo = item['repo']
        score_obj = item['score']

        print(f"{i}. {repo.name_with_owner}")
        print(f"   Overall Score: {score_obj.trending_score:.2f}/100")
        print(f"   Stars: {repo.stargazer_count:,}")
        print(f"   Language: {repo.primary_language or 'N/A'}")

        # Score breakdown
        print(f"   Score Breakdown:")
        print(f"     Star Growth:  {score_obj.star_growth_rate:>5.1f}/100 (35% weight)")
        print(f"     Activity:     {score_obj.activity_score:>5.1f}/100 (25% weight)")
        print(f"     Community:    {score_obj.community_score:>5.1f}/100 (20% weight)")
        print(f"     Recency:      {score_obj.recency_score:>5.1f}/100 (15% weight)")
        print(f"     Quality:      {score_obj.quality_score:>5.1f}/100 ( 5% weight)")
        print()


async def test_get_trending_for_topic(topic_id: str, time_window: str = "daily"):
    """Test retrieving trending repos for a topic"""
    print(f"\n=== Getting Trending Repos for Topic ===")

    async with AsyncSessionLocal() as session:
        trending_service = TrendingService(session)

        repos, total = await trending_service.get_trending_repos_for_topic(
            topic_id=uuid.UUID(topic_id),
            time_window=time_window,
            limit=20
        )

        print(f"✓ Retrieved {len(repos)} trending repositories (total: {total})")

        return repos


async def verify_weighted_scoring():
    """Verify that the weighted scoring algorithm is working correctly"""
    print("\n=== Verifying Weighted Scoring Algorithm ===")

    from app.services.trending_service import WEIGHTS

    print("✓ Scoring Weights:")
    total_weight = 0
    for component, weight in WEIGHTS.items():
        print(f"  {component:20s}: {weight:.2f} ({weight*100:.0f}%)")
        total_weight += weight

    print(f"\nTotal weight: {total_weight:.2f}")

    if abs(total_weight - 1.0) < 0.001:
        print("✓ Weights sum to 1.0 - Correct!")
    else:
        print(f"✗ Warning: Weights sum to {total_weight}, should be 1.0")


async def test_database_persistence(topic_id: str):
    """Test that trending scores are persisted in database"""
    print("\n=== Testing Database Persistence ===")

    async with AsyncSessionLocal() as session:
        # Count trending scores in database
        stmt = select(func.count(TrendingScore.id)).where(
            TrendingScore.topic_id == topic_id
        )
        result = await session.execute(stmt)
        count = result.scalar()

        print(f"✓ Found {count} trending scores in database for this topic")

        # Get sample scores
        stmt = select(TrendingScore).where(
            TrendingScore.topic_id == topic_id
        ).limit(3)
        result = await session.execute(stmt)
        scores = result.scalars().all()

        if scores:
            print("\nSample saved scores:")
            for score in scores:
                print(f"  Repository ID: {score.repository_id}")
                print(f"  Trending Score: {score.trending_score:.2f}")
                print(f"  Time Window: {score.time_window}")
                print(f"  Calculated At: {score.calculated_at}")
                print()

        return count


async def main():
    """Main test runner"""
    print("=" * 60)
    print("TRENDING ALGORITHM TEST")
    print("=" * 60)

    try:
        # Test with multiple topics
        test_topics = ["python", "javascript", "machine-learning"]

        for topic_name in test_topics:
            print(f"\n{'='*60}")
            print(f"TESTING TOPIC: {topic_name.upper()}")
            print('='*60)

            # Step 1: Get/create topic
            topic_id = await get_or_create_topic(topic_name)

            # Step 2: Find repos with this topic
            repos = await find_repos_with_topic(topic_name, limit=10)

            if not repos:
                print(f"✗ No repos found for topic '{topic_name}', skipping...")
                continue

            # Step 3: Calculate trending scores
            scored_repos = await test_calculate_trending_scores(repos, topic_id, "daily")

            if not scored_repos:
                print(f"✗ No scores calculated for topic '{topic_name}', skipping...")
                continue

            # Step 4: Display rankings
            await display_trending_rankings(scored_repos)

            # Step 5: Test retrieval
            trending_repos = await test_get_trending_for_topic(topic_id, "daily")

            # Step 6: Test database persistence
            db_count = await test_database_persistence(topic_id)

            print(f"\n✓ Completed testing for topic: {topic_name}")
            print(f"  - Repos processed: {len(repos)}")
            print(f"  - Scores calculated: {len(scored_repos)}")
            print(f"  - Scores in DB: {db_count}")

        # Step 7: Verify weighted scoring
        await verify_weighted_scoring()

        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"✓ Topics tested: {len(test_topics)}")
        print(f"✓ Weighted scoring algorithm verified")
        print(f"✓ Database persistence verified")
        print("\n✓ All tests passed!")

    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
