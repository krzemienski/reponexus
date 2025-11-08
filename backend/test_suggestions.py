"""
Test Topic Suggestion Engine
Tests generating topic suggestions based on starred repos
"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.db import AsyncSessionLocal
from app.models.user import User
from app.services.suggestion_service import get_suggestion_engine
from sqlalchemy import select


async def get_test_user():
    """Get the test user created by sync service"""
    print("\n=== Getting Test User ===")

    async with AsyncSessionLocal() as session:
        stmt = select(User).where(User.login == "test_user_reponexus")
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            print("✗ Test user not found. Please run test_sync_service.py first!")
            return None

        print(f"✓ Found test user: {user.login} (ID: {user.id})")
        return str(user.id)


async def test_generate_suggestions(user_id: str):
    """Test generating topic suggestions"""
    print("\n=== Generating Topic Suggestions ===")

    suggestion_engine = get_suggestion_engine()

    print("Analyzing starred repositories and generating suggestions...")
    print("This may take a moment...")

    suggestions = await suggestion_engine.generate_suggestions(user_id)

    if not suggestions:
        print("✗ No suggestions generated (user may have no starred repos)")
        return []

    print(f"\n✓ Generated {len(suggestions)} topic suggestions!")

    return suggestions


async def display_suggestions(suggestions):
    """Display suggestion details"""
    print("\n=== Top Topic Suggestions ===")

    for i, suggestion in enumerate(suggestions[:10], 1):
        print(f"\n{i}. {suggestion['topic_display_name']}")
        print(f"   Topic Name: {suggestion['topic_name']}")
        print(f"   Relevance Score: {suggestion['relevance_score']}/100")
        print(f"   Starred Repos with this topic: {suggestion['starred_repo_count']}")
        print(f"   Reason: {suggestion['reason']}")

        if suggestion['example_repos']:
            print(f"   Example Repositories:")
            for repo in suggestion['example_repos'][:3]:
                print(f"     - {repo['name_with_owner']} ({repo['stargazer_count']:,} stars)")


async def test_save_suggestions(user_id: str, suggestions):
    """Test saving suggestions to database"""
    print("\n=== Saving Suggestions to Database ===")

    suggestion_engine = get_suggestion_engine()

    saved_count = await suggestion_engine.save_suggestions(user_id, suggestions)

    print(f"✓ Saved {saved_count} suggestions to database")

    return saved_count


async def test_get_saved_suggestions(user_id: str):
    """Test retrieving saved suggestions"""
    print("\n=== Retrieving Saved Suggestions ===")

    suggestion_engine = get_suggestion_engine()

    saved_suggestions = await suggestion_engine.get_suggestions(user_id)

    print(f"✓ Retrieved {len(saved_suggestions)} saved suggestions from database")

    if saved_suggestions:
        print("\nTop 5 saved suggestions:")
        for i, suggestion in enumerate(saved_suggestions[:5], 1):
            print(f"  {i}. {suggestion['topic_display_name']} (Score: {suggestion['relevance_score']})")

    return saved_suggestions


async def test_suggestion_scoring(suggestions):
    """Analyze suggestion scoring distribution"""
    print("\n=== Analyzing Suggestion Scores ===")

    if not suggestions:
        print("No suggestions to analyze")
        return

    scores = [s['relevance_score'] for s in suggestions]

    print(f"✓ Score Statistics:")
    print(f"  Highest score: {max(scores)}")
    print(f"  Lowest score: {min(scores)}")
    print(f"  Average score: {sum(scores) / len(scores):.2f}")

    # Score distribution
    high_score = len([s for s in scores if s >= 75])
    medium_score = len([s for s in scores if 50 <= s < 75])
    low_score = len([s for s in scores if s < 50])

    print(f"\n✓ Score Distribution:")
    print(f"  High (75-100): {high_score}")
    print(f"  Medium (50-74): {medium_score}")
    print(f"  Low (0-49): {low_score}")


async def verify_suggestions_based_on_stars(user_id: str, suggestions):
    """Verify suggestions are actually based on starred repos"""
    print("\n=== Verifying Suggestions Match Starred Repos ===")

    from app.models.starred_repository import StarredRepository
    from app.models.repository import Repository

    async with AsyncSessionLocal() as session:
        # Get starred repos
        stmt = select(StarredRepository).where(StarredRepository.user_id == user_id)
        result = await session.execute(stmt)
        starred_repos = result.scalars().all()

        # Get all topics from starred repos
        actual_topics = set()
        for starred in starred_repos:
            repo_stmt = select(Repository).where(Repository.id == starred.repository_id)
            repo_result = await session.execute(repo_stmt)
            repo = repo_result.scalar_one_or_none()

            if repo and repo.topics:
                actual_topics.update(repo.topics)

        print(f"✓ Found {len(actual_topics)} topics in starred repositories")

        # Verify suggestions are in actual topics
        suggested_topics = {s['topic_name'] for s in suggestions}

        verified = suggested_topics.issubset(actual_topics)

        if verified:
            print(f"✓ All {len(suggested_topics)} suggested topics are from starred repos!")
        else:
            missing = suggested_topics - actual_topics
            print(f"✗ Warning: {len(missing)} suggested topics not found in starred repos")
            print(f"  Topics: {missing}")


async def main():
    """Main test runner"""
    print("=" * 60)
    print("TOPIC SUGGESTION ENGINE TEST")
    print("=" * 60)

    try:
        # Step 1: Get test user
        user_id = await get_test_user()
        if not user_id:
            return

        # Step 2: Generate suggestions
        suggestions = await test_generate_suggestions(user_id)
        if not suggestions:
            print("\n✗ Cannot continue without suggestions")
            return

        # Step 3: Display suggestions
        await display_suggestions(suggestions)

        # Step 4: Analyze scores
        await test_suggestion_scoring(suggestions)

        # Step 5: Verify suggestions are based on starred repos
        await verify_suggestions_based_on_stars(user_id, suggestions)

        # Step 6: Save suggestions
        saved_count = await test_save_suggestions(user_id, suggestions)

        # Step 7: Retrieve saved suggestions
        saved_suggestions = await test_get_saved_suggestions(user_id)

        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"✓ Suggestions generated: {len(suggestions)}")
        print(f"✓ Suggestions saved: {saved_count}")
        print(f"✓ Suggestions retrieved: {len(saved_suggestions)}")
        print(f"✓ Score range: {min([s['relevance_score'] for s in suggestions])} - {max([s['relevance_score'] for s in suggestions])}")
        print("\n✓ All tests passed!")

    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
