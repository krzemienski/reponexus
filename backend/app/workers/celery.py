"""
Celery Application Configuration
Sets up Celery for async task processing
"""
from celery import Celery
from kombu import Exchange, Queue
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# Create Celery app
celery_app = Celery(
    "reponexus",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.workers.sync_repos",
        "app.workers.sync_trending",
        "app.workers.sync_topics",
        "app.workers.sync_tasks",
    ]
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,

    # Task execution settings
    task_track_started=True,
    task_time_limit=300,  # 5 minutes hard limit
    task_soft_time_limit=240,  # 4 minutes soft limit
    task_acks_late=True,
    task_reject_on_worker_lost=True,

    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    result_persistent=True,

    # Worker settings
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,

    # Retry settings
    task_default_retry_delay=60,  # 1 minute
    task_max_retries=3,

    # Beat settings (for periodic tasks)
    beat_schedule_filename="/tmp/celerybeat-schedule",
)

# Define task queues
celery_app.conf.task_queues = (
    Queue(
        "default",
        Exchange("default"),
        routing_key="default",
        queue_arguments={"x-max-priority": 10}
    ),
    Queue(
        "repos",
        Exchange("repos"),
        routing_key="repos.sync",
        queue_arguments={"x-max-priority": 10}
    ),
    Queue(
        "trending",
        Exchange("trending"),
        routing_key="trending.sync",
        queue_arguments={"x-max-priority": 10}
    ),
    Queue(
        "topics",
        Exchange("topics"),
        routing_key="topics.sync",
        queue_arguments={"x-max-priority": 10}
    ),
)

# Task routing
celery_app.conf.task_routes = {
    "app.workers.sync_repos.*": {
        "queue": "repos",
        "routing_key": "repos.sync"
    },
    "app.workers.sync_trending.*": {
        "queue": "trending",
        "routing_key": "trending.sync"
    },
    "app.workers.sync_topics.*": {
        "queue": "topics",
        "routing_key": "topics.sync"
    },
    "app.workers.sync_tasks.*": {
        "queue": "default",
        "routing_key": "default"
    },
}

# Task priority (higher number = higher priority)
celery_app.conf.task_default_priority = 5

logger.info("Celery app configured successfully")
