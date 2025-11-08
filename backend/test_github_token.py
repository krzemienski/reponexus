#!/usr/bin/env python3
"""
Test script for GitHub token authentication

This script tests the complete token authentication flow:
1. Login with GitHub token
2. Receive JWT access token
3. Test protected endpoint with JWT
4. Display results

Usage:
    python test_github_token.py
"""

import os
import sys
import httpx
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = "http://localhost:8000"
API_V1_PREFIX = "/api/v1"
GITHUB_TOKEN = os.getenv("TEST_GITHUB_TOKEN")

# Colors for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_header(text: str):
    """Print a formatted header"""
    print(f"\n{BLUE}{'=' * 60}{RESET}")
    print(f"{BLUE}{text.center(60)}{RESET}")
    print(f"{BLUE}{'=' * 60}{RESET}\n")


def print_success(text: str):
    """Print success message"""
    print(f"{GREEN}✓ {text}{RESET}")


def print_error(text: str):
    """Print error message"""
    print(f"{RED}✗ {text}{RESET}")


def print_info(text: str):
    """Print info message"""
    print(f"{YELLOW}ℹ {text}{RESET}")


async def test_token_authentication():
    """Test the complete token authentication flow"""

    if not GITHUB_TOKEN:
        print_error("TEST_GITHUB_TOKEN not found in .env file")
        sys.exit(1)

    print_header("GitHub Token Authentication Test")

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Step 1: Verify token
            print_info("Step 1: Verifying GitHub token...")
            verify_response = await client.get(
                f"{BASE_URL}{API_V1_PREFIX}/auth/token/verify",
                params={"github_token": GITHUB_TOKEN}
            )

            if verify_response.status_code == 200:
                verify_data = verify_response.json()
                if verify_data.get("valid"):
                    print_success(f"Token verification: {verify_data.get('message')}")
                else:
                    print_error(f"Token verification failed: {verify_data.get('message')}")
                    return
            else:
                print_error(f"Token verification failed with status {verify_response.status_code}")
                return

            # Step 2: Login with token
            print_info("\nStep 2: Logging in with GitHub token...")
            login_response = await client.post(
                f"{BASE_URL}{API_V1_PREFIX}/auth/token",
                json={"github_token": GITHUB_TOKEN}
            )

            if login_response.status_code != 200:
                print_error(f"Login failed with status {login_response.status_code}")
                print_error(f"Response: {login_response.text}")
                return

            login_data = login_response.json()
            access_token = login_data.get("access_token")
            user_data = login_data.get("user", {})

            print_success("Login successful!")
            print(f"\n{YELLOW}User Information:{RESET}")
            print(f"  Login: {user_data.get('login')}")
            print(f"  Name: {user_data.get('name')}")
            print(f"  Email: {user_data.get('email')}")
            print(f"  GitHub ID: {user_data.get('github_id')}")
            print(f"  Public Repos: {user_data.get('public_repos')}")
            print(f"  Followers: {user_data.get('followers')}")

            print(f"\n{YELLOW}Token Information:{RESET}")
            print(f"  Token Type: {login_data.get('token_type')}")
            print(f"  Expires In: {login_data.get('expires_in')} seconds")
            print(f"  Access Token: {access_token[:20]}...{access_token[-20:]}")

            # Step 3: Test protected endpoint
            print_info("\nStep 3: Testing protected endpoint with JWT...")
            headers = {
                "Authorization": f"Bearer {access_token}"
            }

            # Test getting current user
            me_response = await client.get(
                f"{BASE_URL}{API_V1_PREFIX}/users/me",
                headers=headers
            )

            if me_response.status_code == 200:
                me_data = me_response.json()
                print_success("Protected endpoint access successful!")
                print(f"  Retrieved user: {me_data.get('login')}")
            else:
                print_error(f"Protected endpoint failed with status {me_response.status_code}")
                print_error(f"Response: {me_response.text}")
                return

            # Step 4: Summary
            print_header("Test Summary")
            print_success("All tests passed!")
            print(f"\n{YELLOW}You can now use this JWT token for API requests:{RESET}")
            print(f"{GREEN}{access_token}{RESET}")

            print(f"\n{YELLOW}Example curl command:{RESET}")
            print(f"curl -H 'Authorization: Bearer {access_token}' \\")
            print(f"     {BASE_URL}{API_V1_PREFIX}/users/me")

            print(f"\n{YELLOW}Example Python code:{RESET}")
            print(f"""
import httpx

headers = {{
    "Authorization": "Bearer {access_token[:20]}..."
}}

response = httpx.get(
    "{BASE_URL}{API_V1_PREFIX}/repositories",
    headers=headers
)
print(response.json())
""")

        except httpx.ConnectError:
            print_error("Failed to connect to API server")
            print_info("Make sure the server is running: uvicorn app.main:app --reload")
        except Exception as e:
            print_error(f"Unexpected error: {str(e)}")
            import traceback
            traceback.print_exc()


async def test_health_check():
    """Test if the API server is running"""
    print_info("Checking API server status...")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{BASE_URL}/health")
            if response.status_code == 200:
                data = response.json()
                print_success(f"API server is running (v{data.get('version')})")
                return True
            else:
                print_error("API server health check failed")
                return False
    except httpx.ConnectError:
        print_error("Cannot connect to API server at http://localhost:8000")
        print_info("Start the server with: uvicorn app.main:app --reload")
        return False
    except Exception as e:
        print_error(f"Health check error: {str(e)}")
        return False


async def main():
    """Main function"""
    print_header("Repo Nexus Token Authentication Test")

    # Check if server is running
    if not await test_health_check():
        sys.exit(1)

    # Run authentication tests
    await test_token_authentication()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Test interrupted by user{RESET}")
        sys.exit(0)
