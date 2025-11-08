"""
Master Test Runner
Runs all backend tests in sequence
"""
import asyncio
import sys
import os
from pathlib import Path
import time

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))


async def run_test_script(script_name: str, description: str):
    """Run a test script and return success status"""
    print("\n" + "=" * 80)
    print(f"RUNNING: {description}")
    print("=" * 80)
    print()

    start_time = time.time()

    try:
        # Import and run the test
        if script_name == "test_sync_service":
            from test_sync_service import main
        elif script_name == "test_suggestions":
            from test_suggestions import main
        elif script_name == "test_trending":
            from test_trending import main
        elif script_name == "test_activity":
            from test_activity import main
        elif script_name == "test_integration":
            from test_integration import main
        elif script_name == "test_database_validation":
            from test_database_validation import main
        else:
            print(f"✗ Unknown test script: {script_name}")
            return False

        # Run the test
        await main()

        elapsed = time.time() - start_time
        print(f"\n✓ Test completed in {elapsed:.2f}s")
        return True

    except Exception as e:
        elapsed = time.time() - start_time
        print(f"\n✗ Test failed after {elapsed:.2f}s")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests"""
    print("=" * 80)
    print("REPO NEXUS - COMPREHENSIVE TEST SUITE")
    print("=" * 80)
    print("\nRunning all backend tests with real GitHub data...")
    print()

    # Test suite
    tests = [
        ("test_sync_service", "GitHub Sync Service Test"),
        ("test_suggestions", "Topic Suggestion Engine Test"),
        ("test_trending", "Trending Algorithm Test"),
        ("test_activity", "GitHub Activity Service Test"),
        ("test_integration", "Integration Test - Full Flow"),
        ("test_database_validation", "Database Validation"),
    ]

    results = {}
    total_start = time.time()

    # Run each test
    for script_name, description in tests:
        success = await run_test_script(script_name, description)
        results[description] = success

        # Small pause between tests
        await asyncio.sleep(2)

    total_elapsed = time.time() - total_start

    # Print final summary
    print("\n" + "=" * 80)
    print("TEST SUITE SUMMARY")
    print("=" * 80)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    print(f"\nTests Run: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"\nTotal Time: {total_elapsed:.2f}s")

    print("\nDetailed Results:")
    for test_name, success in results.items():
        status = "✓ PASSED" if success else "✗ FAILED"
        print(f"  {status}: {test_name}")

    if passed == total:
        print("\n" + "=" * 80)
        print("🎉 ALL TESTS PASSED!")
        print("=" * 80)
        return 0
    else:
        print("\n" + "=" * 80)
        print(f"⚠ {total - passed} TEST(S) FAILED")
        print("=" * 80)
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
