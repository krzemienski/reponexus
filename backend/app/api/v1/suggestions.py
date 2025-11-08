from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from app.core.rate_limit import rate_limit
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.suggestion import (
    TopicSuggestionListResponse,
    TopicSuggestionResponse,
    GenerateSuggestionsResponse,
    DismissSuggestionResponse,
    AcceptSuggestionResponse,
)
from app.services.suggestion_service import get_suggestion_engine
from app.workers.sync_tasks import generate_topic_suggestions
from typing import Optional
from uuid import UUID

router = APIRouter()


@router.get("/topics", response_model=TopicSuggestionListResponse)
@rate_limit(requests=30, window=60)
async def get_topic_suggestions(
    request: Request,
    include_dismissed: bool = Query(False),
    current_user: User = Depends(get_current_user),
):
    """
    Get topic suggestions for the current user

    Returns suggestions based on user's starred repositories.
    By default, only shows non-dismissed suggestions.

    Query Parameters:
    - include_dismissed: Include dismissed suggestions in results
    """
    try:
        suggestion_engine = get_suggestion_engine()

        # Get saved suggestions from database
        suggestions = await suggestion_engine.get_suggestions(
            str(current_user.id),
            include_dismissed=include_dismissed
        )

        # For each suggestion, get example repos
        for suggestion in suggestions:
            # Get suggestions with examples
            full_suggestions = await suggestion_engine.generate_suggestions(str(current_user.id))

            # Find matching suggestion
            matching = next(
                (s for s in full_suggestions if s["topic_id"] == suggestion["topic_id"]),
                None
            )

            if matching:
                suggestion["example_repos"] = matching.get("example_repos", [])

        return TopicSuggestionListResponse(
            suggestions=[TopicSuggestionResponse(**s) for s in suggestions],
            total=len(suggestions),
            has_more=False
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get suggestions: {str(e)}"
        )


@router.post("/topics/generate", response_model=GenerateSuggestionsResponse)
@rate_limit(requests=10, window=300)  # 10 requests per 5 minutes
async def generate_suggestions(
    request: Request,
    current_user: User = Depends(get_current_user),
):
    """
    Generate new topic suggestions for the current user

    This will:
    1. Analyze user's starred repositories
    2. Extract topics from those repos
    3. Filter out already-followed topics
    4. Calculate relevance scores
    5. Save top suggestions to database

    Rate limited to prevent abuse.
    """
    try:
        # Start background task
        task = generate_topic_suggestions.delay(str(current_user.id))

        return GenerateSuggestionsResponse(
            success=True,
            suggestions_generated=0,  # Will be updated by background task
            suggestions_saved=0,
            message="Suggestion generation started in background"
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate suggestions: {str(e)}"
        )


@router.post("/topics/{suggestion_id}/dismiss", response_model=DismissSuggestionResponse)
@rate_limit(requests=30, window=60)
async def dismiss_suggestion(
    request: Request,
    suggestion_id: UUID,
    current_user: User = Depends(get_current_user),
):
    """
    Dismiss a topic suggestion

    This marks the suggestion as dismissed so it won't appear again.
    The user can still see it by setting include_dismissed=true.
    """
    try:
        suggestion_engine = get_suggestion_engine()

        success = await suggestion_engine.dismiss_suggestion(str(suggestion_id))

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Suggestion not found"
            )

        return DismissSuggestionResponse(
            success=True,
            message="Suggestion dismissed",
            suggestion_id=suggestion_id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to dismiss suggestion: {str(e)}"
        )


@router.post("/topics/{suggestion_id}/accept", response_model=AcceptSuggestionResponse)
@rate_limit(requests=30, window=60)
async def accept_suggestion(
    request: Request,
    suggestion_id: UUID,
    current_user: User = Depends(get_current_user),
):
    """
    Accept a topic suggestion

    This will:
    1. Mark the suggestion as accepted
    2. Automatically follow the suggested topic
    3. Enable notifications for the topic (by default)
    """
    try:
        suggestion_engine = get_suggestion_engine()

        success = await suggestion_engine.accept_suggestion(str(suggestion_id))

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Suggestion not found"
            )

        # Get the suggestion details for response
        suggestions = await suggestion_engine.get_suggestions(
            str(current_user.id),
            include_dismissed=True
        )

        suggestion = next(
            (s for s in suggestions if str(s["id"]) == str(suggestion_id)),
            None
        )

        if not suggestion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Suggestion not found"
            )

        return AcceptSuggestionResponse(
            success=True,
            message="Suggestion accepted, now following topic",
            suggestion_id=suggestion_id,
            topic_id=UUID(suggestion["topic_id"]),
            topic_name=suggestion["topic_name"]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to accept suggestion: {str(e)}"
        )
