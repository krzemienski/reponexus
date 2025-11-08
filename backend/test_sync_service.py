"""
Test GitHub Sync Service
Tests fetching and syncing starred repositories from GitHub
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
from app.services.github_sync_service import get_sync_service
from sqlalchemy import select
import uuid
from datetime import datetime

# GitHub Token
GITHUB_TOKEN = "ghp_REDACTED_TOKEN_FOR_SECURITY"


async def create_test_user():
    """Create or get test user with GitHub token"""
    print("\n=== Creating/Getting Test User ===")

    async with AsyncSessionLocal() as session:
        # Check if test user exists
        stmt = select(User).where(User.login == "test_user_reponexus")
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if user:
            print(f"✓ Found existing test user: {user.login} (ID: {user.id})")
            # Update token
            user.access_token = GITHUB_TOKEN
            await session.commit()
        else:
            # Create new test user
            user = User(
                id=uuid.uuid4(),
                github_id="test_github_id_" + str(uuid.uuid4()),
                login="test_user_reponexus",
                name="Test User",
                email="test@reponexus.com",
                access_token=GITHUB_TOKEN,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(user)
            await session.commit()
            print(f"✓ Created new test user: {user.login} (ID: {user.id})")

        return str(user.id)


async def test_sync_starred_repos(user_id: str):
    """Test syncing starred repositories"""
    print("\n=== Testing GitHub Starred Repos Sync ===")

    sync_service = get_sync_service()

    # Sync repos (limit to 50 for testing)
    print(f"Syncing starred repos for user {user_id}...")
    print("This may take a few moments...")

    result = await sync_service.sync_user_starred_repos(
        user_id=user_id,
        max_repos=50  # Limit for testing
    )

    if result["success"]:
        print("\n✓ Sync completed successfully!")
        print(f"  Total starred repos fetched: {result['total_starred']}")
        print(f"  Repos created in DB: {result['repos_created']}")
        print(f"  Repos updated in DB: {result['repos_updated']}")
        print(f"  Stars created: {result['stars_created']}")
        print(f"  Stars updated: {result['stars_updated']}")
    else:
        print(f"\n✗ Sync failed: {result.get('error', 'Unknown error')}")
        return False

    return True


async def verify_synced_data(user_id: str):
    """Verify synced data in database"""
    print("\n=== Verifying Synced Data ===")

    async with AsyncSessionLocal() as session:
        # Count starred repos
        stmt = select(StarredRepository).where(StarredRepository.user_id == user_id)
        result = await session.execute(stmt)
        starred_repos = result.scalars().all()

        print(f"✓ Found {len(starred_repos)} starred repositories in database")

        # Get some repository details
        if starred_repos:
            print("\nSample repositories (first 5):")
            for i, starred in enumerate(starred_repos[:5]):
                # Fetch repository details
                repo_stmt = select(Repository).where(Repository.id == starred.repository_id)
                repo_result = await session.execute(repo_stmt)
                repo = repo_result.scalar_one_or_none()

                if repo:
                    print(f"\n  {i+1}. {repo.name_with_owner}")
                    print(f"     Description: {repo.description[:80] if repo.description else 'N/A'}...")
                    print(f"     Stars: {repo.stargazer_count:,}")
                    print(f"     Language: {repo.primary_language or 'N/A'}")
                    print(f"     Topics: {', '.join(repo.topics[:5]) if repo.topics else 'None'}")

        # Count unique topics found
        all_topics = set()
        repo_ids = [sr.repository_id for sr in starred_repos]

        if repo_ids:
            stmt = select(Repository).where(Repository.id.in_(repo_ids))
            result = await session.execute(stmt)
            repos = result.scalars().all()

            for repo in repos:
                if repo.topics:
                    all_topics.update(repo.topics)

        print(f"\n✓ Found {len(all_topics)} unique topics across starred repos")
        if all_topics:
            print(f"  Sample topics: {', '.join(list(all_topics)[:10])}")

        return len(starred_repos), len(all_topics)


async def test_sync_status(user_id: str):
    """Test getting sync status"""
    print("\n=== Testing Sync Status ===")

    sync_service = get_sync_service()
    status = await sync_service.get_sync_status(user_id)

    print(f"✓ Sync Status:")
    print(f"  Total starred: {status['total_starred']}")
    print(f"  Last sync: {status['last_sync_at']}")
    print(f"  Has synced: {status['has_synced']}")

    return status


async def main():
    """Main test runner"""
    print("=" * 60)
    print("GITHUB SYNC SERVICE TEST")
    print("=" * 60)

    try:
        # Step 1: Create test user
        user_id = await create_test_user()

        # Step 2: Test sync
        success = await test_sync_starred_repos(user_id)
        if not success:
            print("\n✗ Test failed during sync")
            return

        # Step 3: Verify data
        repo_count, topic_count = await verify_synced_data(user_id)

        # Step 4: Check sync status
        status = await test_sync_status(user_id)

        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"✓ User created/updated: {user_id}")
        print(f"✓ Repositories synced: {repo_count}")
        print(f"✓ Unique topics found: {topic_count}")
        print(f"✓ Last sync: {status['last_sync_at']}")
        print("\n✓ All tests passed!")

    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
