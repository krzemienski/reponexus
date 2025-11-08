"""
GitHub Token Service for token-based authentication
"""

import httpx
from typing import Optional, Dict, Any
from fastapi import HTTPException, status


class GitHubTokenService:
    """
    Service class for GitHub token verification and user data retrieval
    """

    BASE_URL = "https://api.github.com"

    def __init__(self, token: str):
        """
        Initialize the service with a GitHub token

        Args:
            token: GitHub personal access token
        """
        self.token = token
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json",
        }

    async def verify_token(self) -> bool:
        """
        Verify if the GitHub token is valid

        Returns:
            True if token is valid, False otherwise
        """
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/user",
                    headers=self.headers,
                    timeout=30.0,
                )
                return response.status_code == 200
            except Exception:
                return False

    async def get_user_info(self) -> Dict[str, Any]:
        """
        Get user information from GitHub API

        Returns:
            Dictionary containing user information

        Raises:
            HTTPException: If request fails or token is invalid
        """
        async with httpx.AsyncClient() as client:
            try:
                # Fetch user profile
                response = await client.get(
                    f"{self.BASE_URL}/user",
                    headers=self.headers,
                    timeout=30.0,
                )
                response.raise_for_status()
                user_data = response.json()

                # If email is not public, fetch from emails endpoint
                if not user_data.get("email"):
                    try:
                        emails_response = await client.get(
                            f"{self.BASE_URL}/user/emails",
                            headers=self.headers,
                            timeout=30.0,
                        )
                        if emails_response.status_code == 200:
                            emails = emails_response.json()
                            # Get primary email
                            primary_email = next(
                                (e["email"] for e in emails if e.get("primary")),
                                None,
                            )
                            if primary_email:
                                user_data["email"] = primary_email
                    except Exception:
                        # If we can't get email, continue without it
                        pass

                return user_data

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 401:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid GitHub token",
                    )
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Failed to fetch user data from GitHub: {str(e)}",
                )
            except httpx.HTTPError as e:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Failed to communicate with GitHub: {str(e)}",
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error processing GitHub user data: {str(e)}",
                )
