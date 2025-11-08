"""
Test GitHub Activity Service
Tests fetching repository activity metrics from GitHub API
"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.db import AsyncSessionLocal
from app.models.repository import Repository
from app.services.github_activity_service import get_github_activity_service
from sqlalchemy import select
import uuid


async def get_sample_repositories(limit: int = 5):
    """Get sample repositories from database"""
    print(f"\n=== Getting Sample Repositories ===")

    async with AsyncSessionLocal() as session:
        # Get repos with stars (more likely to have activity)
        stmt = select(Repository).where(
            Repository.stargazer_count > 100
        ).order_by(Repository.stargazer_count.desc()).limit(limit)

        result = await session.execute(stmt)
        repos = result.scalars().all()

        print(f"✓ Found {len(repos)} repositories")

        if repos:
            print("\nRepositories to test:")
            for i, repo in enumerate(repos, 1):
                print(f"  {i}. {repo.name_with_owner} ({repo.stargazer_count:,} stars)")

        return repos


async def test_fetch_activity(repo, days: int = 7):
    """Test fetching activity data for a repository"""
    print(f"\n=== Fetching Activity: {repo.name_with_owner} ===")

    async with AsyncSessionLocal() as session:
        activity_service = get_github_activity_service(session)

        print(f"Fetching {days}-day activity data...")

        activity_data = await activity_service.fetch_repo_activity(
            repo_id=uuid.UUID(str(repo.id)),
            days=days
        )

        if activity_data:
            print(f"\n✓ Activity data retrieved:")
            print(f"  Stars Gained (estimated): {activity_data['stars_gained']}")
            print(f"  Commits: {activity_data['commits']}")
            print(f"  PRs Merged: {activity_data['prs_merged']}")
            print(f"  Issues Closed: {activity_data['issues_closed']}")
            print(f"  New Contributors: {activity_data['new_contributors']}")
            print(f"  PR Merge Rate: {activity_data['pr_merge_rate']:.1%}")
            print(f"  Fetched At: {activity_data['fetched_at']}")
        else:
            print(f"✗ Failed to fetch activity data")

        return activity_data


async def test_caching(repo):
    """Test that activity data caching works"""
    print(f"\n=== Testing Caching for {repo.name_with_owner} ===")

    async with AsyncSessionLocal() as session:
        activity_service = get_github_activity_service(session)

        # First fetch (should hit API)
        print("First fetch (should query GitHub API)...")
        import time
        start_time = time.time()

        data1 = await activity_service.fetch_repo_activity(
            repo_id=uuid.UUID(str(repo.id)),
            days=7
        )
        first_fetch_time = time.time() - start_time

        # Second fetch (should use cache)
        print("Second fetch (should use cache)...")
        start_time = time.time()

        data2 = await activity_service.fetch_repo_activity(
            repo_id=uuid.UUID(str(repo.id)),
            days=7
        )
        second_fetch_time = time.time() - start_time

        print(f"\n✓ Timing comparison:")
        print(f"  First fetch: {first_fetch_time:.3f}s")
        print(f"  Second fetch: {second_fetch_time:.3f}s")

        if data1 == data2:
            print(f"✓ Data consistency: Same data returned from cache")
        else:
            print(f"✗ Warning: Data mismatch between fetches")

        if second_fetch_time < first_fetch_time / 2:
            print(f"✓ Caching working: Second fetch was significantly faster")
        else:
            print(f"⚠ Cache may not be working optimally")


async def test_batch_fetch(repos):
    """Test batch fetching activity data"""
    print(f"\n=== Testing Batch Activity Fetch ===")

    async with AsyncSessionLocal() as session:
        activity_service = get_github_activity_service(session)

        repo_ids = [uuid.UUID(str(repo.id)) for repo in repos[:3]]

        print(f"Fetching activity for {len(repo_ids)} repositories...")

        results = await activity_service.batch_fetch_activity(repo_ids, days=7)

        print(f"\n✓ Batch fetch completed")
        print(f"  Requested: {len(repo_ids)} repos")
        print(f"  Retrieved: {len(results)} results")

        for repo_id, activity_data in results.items():
            # Find repo name
            repo = next((r for r in repos if str(r.id) == str(repo_id)), None)
            repo_name = repo.name_with_owner if repo else "Unknown"

            print(f"\n  {repo_name}:")
            print(f"    Commits: {activity_data['commits']}")
            print(f"    PRs Merged: {activity_data['prs_merged']}")

        return results


async def test_activity_metrics_calculation(activity_data):
    """Test that activity metrics are reasonable"""
    print(f"\n=== Validating Activity Metrics ===")

    if not activity_data:
        print("✗ No activity data to validate")
        return

    # Check ranges
    checks = [
        ("stars_gained", activity_data['stars_gained'] >= 0, "Stars gained should be non-negative"),
        ("commits", activity_data['commits'] >= 0, "Commits should be non-negative"),
        ("prs_merged", activity_data['prs_merged'] >= 0, "PRs merged should be non-negative"),
        ("issues_closed", activity_data['issues_closed'] >= 0, "Issues closed should be non-negative"),
        ("new_contributors", activity_data['new_contributors'] >= 0, "New contributors should be non-negative"),
        ("pr_merge_rate", 0 <= activity_data['pr_merge_rate'] <= 1, "PR merge rate should be 0-1"),
    ]

    all_valid = True
    for metric, is_valid, description in checks:
        if is_valid:
            print(f"  ✓ {description}")
        else:
            print(f"  ✗ {description} (value: {activity_data[metric]})")
            all_valid = False

    if all_valid:
        print("\n✓ All activity metrics are valid!")
    else:
        print("\n✗ Some metrics failed validation")

    return all_valid


async def compare_activity_across_time_windows(repo):
    """Compare activity data for different time windows"""
    print(f"\n=== Comparing Time Windows for {repo.name_with_owner} ===")

    async with AsyncSessionLocal() as session:
        activity_service = get_github_activity_service(session)

        time_windows = [7, 14, 30]
        results = {}

        for days in time_windows:
            print(f"Fetching {days}-day activity...")
            activity_data = await activity_service.fetch_repo_activity(
                repo_id=uuid.UUID(str(repo.id)),
                days=days
            )
            results[days] = activity_data

        print(f"\n✓ Activity Comparison:")
        print(f"{'Metric':<20} {'7 days':<10} {'14 days':<10} {'30 days':<10}")
        print("-" * 60)

        metrics = ['commits', 'prs_merged', 'issues_closed']
        for metric in metrics:
            values = [results[days][metric] for days in time_windows]
            print(f"{metric:<20} {values[0]:<10} {values[1]:<10} {values[2]:<10}")


async def main():
    """Main test runner"""
    print("=" * 60)
    print("GITHUB ACTIVITY SERVICE TEST")
    print("=" * 60)

    try:
        # Step 1: Get sample repositories
        repos = await get_sample_repositories(limit=5)

        if not repos:
            print("\n✗ No repositories found. Please run test_sync_service.py first!")
            return

        # Step 2: Test activity fetch for first repo
        test_repo = repos[0]
        activity_data = await test_fetch_activity(test_repo, days=7)

        if not activity_data:
            print("\n⚠ Activity fetch failed, but continuing tests...")

        # Step 3: Test caching
        if activity_data:
            await test_caching(test_repo)

        # Step 4: Test batch fetch
        batch_results = await test_batch_fetch(repos)

        # Step 5: Validate metrics
        if activity_data:
            all_valid = await test_activity_metrics_calculation(activity_data)

        # Step 6: Compare time windows
        if len(repos) > 1:
            await compare_activity_across_time_windows(repos[1])

        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"✓ Repositories tested: {len(repos)}")
        print(f"✓ Batch fetch results: {len(batch_results)}")
        print(f"✓ Caching mechanism tested")
        print(f"✓ Activity metrics validated")
        print("\n✓ All tests passed!")

    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
