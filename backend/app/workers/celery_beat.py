"""
Celery Beat Scheduler Configuration
Defines periodic tasks and their schedules
"""
from celery.schedules import crontab
from app.workers.celery import celery_app

# Configure beat schedule
celery_app.conf.beat_schedule = {
    # ==================== Trending Sync Tasks ====================

    # Sync daily trending every 15 minutes
    "sync-daily-trending": {
        "task": "sync_trending",
        "schedule": 900.0,  # 15 minutes
        "args": ("daily", None),
        "options": {
            "priority": 8,
            "expires": 600  # Expire if not executed within 10 minutes
        }
    },

    # Sync weekly trending every hour
    "sync-weekly-trending": {
        "task": "sync_trending",
        "schedule": 3600.0,  # 1 hour
        "args": ("weekly", None),
        "options": {"priority": 7}
    },

    # Sync monthly trending every 6 hours
    "sync-monthly-trending": {
        "task": "sync_trending",
        "schedule": 21600.0,  # 6 hours
        "args": ("monthly", None),
        "options": {"priority": 6}
    },

    # Calculate trending scores every 30 minutes
    "calculate-trending-scores": {
        "task": "calculate_trending_scores",
        "schedule": 1800.0,  # 30 minutes
        "options": {"priority": 7}
    },

    # Update trending cache every 10 minutes
    "update-trending-cache": {
        "task": "update_trending_cache",
        "schedule": 600.0,  # 10 minutes
        "options": {"priority": 8}
    },

    # Cleanup old trending scores daily at 3 AM
    "cleanup-old-trending-scores": {
        "task": "cleanup_old_trending_scores",
        "schedule": crontab(hour=3, minute=0),
        "args": (60,),  # Reset scores older than 60 days
        "options": {"priority": 3}
    },

    # ==================== Topic-Centric Trending Tasks ====================

    # Calculate daily trending for popular topics every 6 hours
    "calculate-daily-trending-popular": {
        "task": "refresh_trending_for_popular_topics",
        "schedule": 21600.0,  # 6 hours
        "args": ("daily", 50),
        "options": {"priority": 8}
    },

    # Calculate weekly trending for popular topics every 12 hours
    "calculate-weekly-trending-popular": {
        "task": "refresh_trending_for_popular_topics",
        "schedule": 43200.0,  # 12 hours
        "args": ("weekly", 50),
        "options": {"priority": 7}
    },

    # Calculate monthly trending for popular topics daily at 6 AM
    "calculate-monthly-trending-popular": {
        "task": "refresh_trending_for_popular_topics",
        "schedule": crontab(hour=6, minute=0),
        "args": ("monthly", 50),
        "options": {"priority": 6}
    },

    # Update trending cache for topics every 5 minutes (daily window)
    "update-trending-cache-topics-daily": {
        "task": "update_trending_cache_for_topics",
        "schedule": 300.0,  # 5 minutes
        "args": ("daily",),
        "options": {"priority": 9}
    },

    # Update trending cache for topics every 15 minutes (weekly window)
    "update-trending-cache-topics-weekly": {
        "task": "update_trending_cache_for_topics",
        "schedule": 900.0,  # 15 minutes
        "args": ("weekly",),
        "options": {"priority": 8}
    },

    # Update trending cache for topics every 30 minutes (monthly window)
    "update-trending-cache-topics-monthly": {
        "task": "update_trending_cache_for_topics",
        "schedule": 1800.0,  # 30 minutes
        "args": ("monthly",),
        "options": {"priority": 7}
    },

    # Cleanup trending scores older than 7 days - daily at 4 AM
    "cleanup-trending-scores-daily": {
        "task": "cleanup_trending_scores",
        "schedule": crontab(hour=4, minute=0),
        "args": (7,),
        "options": {"priority": 3}
    },

    # ==================== Repository Sync Tasks ====================

    # Full repository sync daily at 2 AM
    "sync-all-repositories": {
        "task": "sync_all_repositories",
        "schedule": crontab(hour=2, minute=0),
        "args": (1000,),  # Sync up to 1000 repos
        "options": {"priority": 5}
    },

    # ==================== Topic Sync Tasks ====================

    # Discover topics daily at 4 AM
    "discover-topics": {
        "task": "discover_topics",
        "schedule": crontab(hour=4, minute=0),
        "options": {"priority": 6}
    },

    # Sync all topics daily at 5 AM
    "sync-all-topics": {
        "task": "sync_all_topics",
        "schedule": crontab(hour=5, minute=0),
        "options": {"priority": 5}
    },

    # Update topic statistics every 2 hours
    "update-topic-stats": {
        "task": "update_topic_stats",
        "schedule": 7200.0,  # 2 hours
        "options": {"priority": 6}
    },

    # Sync trending topics every hour
    "sync-trending-topics": {
        "task": "sync_trending_topics",
        "schedule": 3600.0,  # 1 hour
        "args": (20,),  # Top 20 topics
        "options": {"priority": 7}
    },

    # Cleanup unused topics weekly on Sunday at 1 AM
    "cleanup-unused-topics": {
        "task": "cleanup_unused_topics",
        "schedule": crontab(hour=1, minute=0, day_of_week=0),
        "args": (5,),  # Topics with fewer than 5 repos
        "options": {"priority": 3}
    },

    # ==================== Language-Specific Trending ====================

    # Python trending - every 30 minutes
    "sync-trending-python": {
        "task": "sync_trending",
        "schedule": 1800.0,
        "args": ("daily", "python"),
        "options": {"priority": 7}
    },

    # JavaScript trending - every 30 minutes
    "sync-trending-javascript": {
        "task": "sync_trending",
        "schedule": 1800.0,
        "args": ("daily", "javascript"),
        "options": {"priority": 7}
    },

    # TypeScript trending - every 30 minutes
    "sync-trending-typescript": {
        "task": "sync_trending",
        "schedule": 1800.0,
        "args": ("daily", "typescript"),
        "options": {"priority": 7}
    },

    # Java trending - every hour
    "sync-trending-java": {
        "task": "sync_trending",
        "schedule": 3600.0,
        "args": ("daily", "java"),
        "options": {"priority": 6}
    },

    # Go trending - every hour
    "sync-trending-go": {
        "task": "sync_trending",
        "schedule": 3600.0,
        "args": ("daily", "go"),
        "options": {"priority": 6}
    },

    # Rust trending - every hour
    "sync-trending-rust": {
        "task": "sync_trending",
        "schedule": 3600.0,
        "args": ("daily", "rust"),
        "options": {"priority": 6}
    },

    # ==================== Maintenance Tasks ====================

    # Clear API usage data older than 7 days - daily at midnight
    "clear-old-api-usage": {
        "task": "clear_old_api_usage",
        "schedule": crontab(hour=0, minute=0),
        "args": (7,),
        "options": {"priority": 2}
    },
}

# Additional beat configuration
celery_app.conf.update(
    # Beat scheduler settings
    beat_schedule_filename="/tmp/celerybeat-schedule",
    beat_max_loop_interval=5,  # Check for new tasks every 5 seconds
)


# Task to clear old API usage data (needs to be implemented)
@celery_app.task(name="clear_old_api_usage")
def clear_old_api_usage(days: int = 7):
    """Clear old API usage data"""
    import asyncio
    from app.services.api_usage_service import get_api_usage_service

    async def _clear():
        service = get_api_usage_service()
        await service.clear_old_data(days)

    loop = asyncio.get_event_loop()
    return loop.run_until_complete(_clear())
