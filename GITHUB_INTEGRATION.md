# GitHub Integration Service - Phase 5 Implementation

## Overview

Complete implementation of GitHub API integration service for Repo Nexus, including REST API client, GraphQL client, caching layer, async workers, and webhook handling.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub API Integration                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  GitHub Service  │      │ GraphQL Client   │            │
│  │   (REST API)     │      │   (Bulk Ops)     │            │
│  └────────┬─────────┘      └────────┬─────────┘            │
│           │                          │                       │
│           └──────────┬───────────────┘                       │
│                      │                                       │
│           ┌──────────▼─────────────┐                        │
│           │   Cache Service        │                        │
│           │   (Redis, TTLs)        │                        │
│           └──────────┬─────────────┘                        │
│                      │                                       │
│  ┌───────────────────┴────────────────────────┐            │
│  │          Celery Workers (Async)             │            │
│  ├─────────────────────────────────────────────┤            │
│  │  • Repository Sync    • Trending Sync       │            │
│  │  • Topic Sync         • Statistics          │            │
│  └─────────────────────────────────────────────┘            │
│                      │                                       │
│           ┌──────────▼─────────────┐                        │
│           │   Webhook Handler      │                        │
│           │   (Real-time Updates)  │                        │
│           └────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. GitHub Service (`app/services/github_service.py`)

Comprehensive REST API client with advanced features:

**Features:**
- ✅ Rate limiting with automatic delays
- ✅ Retry logic with exponential backoff
- ✅ Circuit breaker pattern for fault tolerance
- ✅ Request/response logging
- ✅ User, repository, and trending data fetching
- ✅ HTML scraping for trending (when no API available)

**Methods:**
- `fetch_user(username)` - Fetch GitHub user
- `fetch_repository(owner, name)` - Fetch repository details
- `search_repositories(query, page)` - Search repositories
- `fetch_readme(owner, name)` - Fetch and decode README
- `fetch_languages(owner, name)` - Get repository languages
- `fetch_contributors(owner, name)` - Get top contributors
- `star_repository(owner, name, token)` - Star a repository
- `unstar_repository(owner, name, token)` - Unstar a repository
- `fetch_trending(period, language)` - Scrape trending repositories

**Rate Limiting:**
```python
# Automatic rate limit handling
limiter = GitHubRateLimiter()
limiter.update_from_headers(response.headers)
await limiter.wait_if_needed()  # Auto-wait when limited

# Get current status
status = service.get_rate_limit_status()
# {
#   "limit": 5000,
#   "remaining": 4950,
#   "reset_at": "2024-01-01T12:00:00",
#   "is_limited": False
# }
```

**Circuit Breaker:**
```python
# Prevents cascading failures
cb = CircuitBreaker(failure_threshold=5, timeout=60)

# States: CLOSED → OPEN → HALF_OPEN → CLOSED
# Opens after 5 consecutive failures
# Tries again after 60 seconds
```

### 2. Cache Service (`app/services/cache_service.py`)

Intelligent Redis-based caching with different TTLs:

**TTL Configuration:**
- User data: 1 hour (3600s)
- Repository data: 15 minutes (900s)
- Trending data: 5 minutes (300s)
- README content: 1 hour (3600s)
- Languages: 30 minutes (1800s)
- Search results: 10 minutes (600s)

**Usage:**
```python
cache = get_cache_service()

# Cache repository
await cache.cache_repository("owner", "repo", data)

# Get cached data
data = await cache.get_repository("owner", "repo")

# Invalidate cache
await cache.invalidate_repository("owner", "repo")

# Batch operations
await cache.set_many({"key1": "val1", "key2": "val2"}, ttl=3600)
results = await cache.get_many(["key1", "key2"])

# Cache statistics
stats = await cache.get_stats()
```

**Decorator:**
```python
@cached(ttl=300, key_prefix="expensive")
async def expensive_operation(arg):
    # This result will be cached for 5 minutes
    return compute_expensive_result(arg)
```

### 3. GitHub GraphQL Client (`app/services/github_graphql.py`)

Efficient bulk data operations using GitHub's GraphQL v4 API:

**Features:**
- Fetch user with repositories in one query
- Bulk repository fetching (up to 10 at once)
- Repository with contributors
- Topic-based searches
- Pagination with cursors

**Usage:**
```python
graphql = get_github_graphql_client()

# Fetch user with repos
data = await graphql.fetch_user_with_repos(
    username="octocat",
    first=30,
    after=cursor
)

# Fetch multiple repos at once
repos = [
    {"owner": "facebook", "name": "react"},
    {"owner": "microsoft", "name": "vscode"}
]
data = await graphql.fetch_multiple_repositories(repos)

# Search by topic
results = await graphql.fetch_repositories_by_topic(
    topic="machine-learning",
    first=30
)
```

### 4. API Usage Service (`app/services/api_usage_service.py`)

Track and monitor all GitHub API usage:

**Features:**
- Track every API call with metadata
- Monitor rate limits
- Generate statistics and reports
- Alert on low rate limits
- Dashboard data aggregation

**Usage:**
```python
usage = get_api_usage_service()

# Track an API call
await usage.track_api_call(
    endpoint="/repos/owner/repo",
    method="GET",
    status_code=200,
    response_time=0.5,
    rate_limit_remaining=4950,
    rate_limit_limit=5000
)

# Get today's stats
stats = await usage.get_today_stats()

# Get dashboard data
dashboard = await usage.get_dashboard_data()
# {
#   "today": {...},
#   "rate_limit": {...},
#   "endpoint_stats": {...},
#   "hourly_stats": [...],
#   "alerts": [...]
# }
```

### 5. Celery Workers

Asynchronous background tasks for data synchronization:

#### Repository Sync (`app/workers/sync_repos.py`)

**Tasks:**
- `sync_repository(owner, name)` - Sync single repository
- `sync_user_repositories(username)` - Sync all user repos
- `sync_all_repositories(limit)` - Full sync of all repos
- `batch_sync_repositories(repos)` - Batch sync multiple repos
- `update_repository_stats(owner, name, stats)` - Update stats only

**Usage:**
```python
from app.workers.sync_repos import sync_repository

# Queue sync task
sync_repository.delay("facebook", "react")

# Sync user's repos
sync_user_repositories.delay("octocat", max_repos=100)

# Full sync (scheduled via Celery Beat)
sync_all_repositories.delay(limit=1000)
```

#### Trending Sync (`app/workers/sync_trending.py`)

**Tasks:**
- `sync_trending(period, language)` - Sync trending for period/language
- `sync_all_trending()` - Sync all trending combinations
- `calculate_trending_scores()` - Calculate scores based on activity
- `update_trending_cache()` - Update cache from database
- `cleanup_old_trending_scores(days)` - Reset old scores

**Usage:**
```python
from app.workers.sync_trending import sync_trending

# Sync daily Python trending
sync_trending.delay("daily", "python")

# Calculate trending scores
calculate_trending_scores.delay()
```

#### Topic Sync (`app/workers/sync_topics.py`)

**Tasks:**
- `discover_topics()` - Discover popular topics
- `sync_topic(topic_name)` - Sync specific topic
- `sync_all_topics()` - Sync all topics
- `update_topic_stats()` - Update topic repository counts
- `sync_trending_topics(limit)` - Sync top topics
- `cleanup_unused_topics(min_repos)` - Remove unused topics

**Usage:**
```python
from app.workers.sync_topics import sync_topic

# Sync a topic
sync_topic.delay("machine-learning", fetch_repos=True)

# Update all topic stats
update_topic_stats.delay()
```

### 6. Celery Beat Scheduler (`app/workers/celery_beat.py`)

Automated periodic task scheduling:

**Schedule:**

| Task | Frequency | Priority | Description |
|------|-----------|----------|-------------|
| sync-daily-trending | 15 minutes | 8 | Sync daily trending repos |
| sync-weekly-trending | 1 hour | 7 | Sync weekly trending |
| sync-monthly-trending | 6 hours | 6 | Sync monthly trending |
| calculate-trending-scores | 30 minutes | 7 | Calculate trending scores |
| update-trending-cache | 10 minutes | 8 | Update trending cache |
| sync-all-repositories | Daily 2 AM | 5 | Full repo sync |
| discover-topics | Daily 4 AM | 6 | Discover new topics |
| sync-all-topics | Daily 5 AM | 5 | Sync all topics |
| update-topic-stats | 2 hours | 6 | Update topic stats |
| sync-trending-topics | 1 hour | 7 | Sync trending topics |
| cleanup-old-trending-scores | Weekly | 3 | Clean old scores |
| cleanup-unused-topics | Weekly | 3 | Remove unused topics |

**Language-Specific:**
- Python, JavaScript, TypeScript: Every 30 minutes
- Java, Go, Rust: Every hour

### 7. Webhook Handler (`app/api/v1/webhooks.py`)

Real-time updates from GitHub webhooks:

**Supported Events:**
- `push` - Update repository pushed_at timestamp
- `star` - Update star count
- `fork` - Update fork count
- `repository` - Full repository update

**Features:**
- ✅ Signature verification (HMAC SHA-256)
- ✅ Async task queueing
- ✅ Event routing
- ✅ Error handling

**Setup:**
1. Configure webhook in GitHub repository settings
2. Set webhook URL: `https://your-domain.com/api/v1/webhooks/github`
3. Select events: push, star, fork, repository
4. Set secret: Use `GITHUB_CLIENT_SECRET` from config

**Usage:**
```bash
# Test endpoint
curl http://localhost:8000/api/v1/webhooks/github/test

# Manual trigger (for testing)
curl -X POST http://localhost:8000/api/v1/webhooks/github/manual \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "sync",
    "owner": "facebook",
    "name": "react"
  }'
```

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements-github.txt
```

### 2. Configure Environment

Add to `.env`:
```bash
# GitHub API
GITHUB_API_URL=https://api.github.com
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

### 3. Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or install locally
redis-server
```

### 4. Start Celery Worker

```bash
# From backend directory
celery -A app.workers.celery worker --loglevel=info
```

### 5. Start Celery Beat (Scheduler)

```bash
celery -A app.workers.celery beat --loglevel=info
```

### 6. Start API Server

```bash
python -m app.main
```

## Testing

### Run All Tests

```bash
pytest tests/services/ -v
```

### Run Specific Tests

```bash
# GitHub Service tests
pytest tests/services/test_github_service.py -v

# Cache Service tests
pytest tests/services/test_cache_service.py -v

# API Usage tests
pytest tests/services/test_api_usage_service.py -v
```

### Test Coverage

```bash
pytest tests/services/ --cov=app/services --cov-report=html
```

## Usage Examples

### Example 1: Fetch and Cache Repository

```python
from app.services.github_service import get_github_service
from app.services.cache_service import get_cache_service

github = get_github_service()
cache = get_cache_service()

# Check cache first
data = await cache.get_repository("facebook", "react")

if not data:
    # Fetch from GitHub
    data = await github.fetch_repository("facebook", "react")

    # Cache for 15 minutes
    await cache.cache_repository("facebook", "react", data)

print(f"Stars: {data['stargazers_count']}")
```

### Example 2: Search with Caching

```python
query = "machine learning python"
page = 1

# Try cache first
cached = await cache.get_search_results(query, page)

if not cached:
    # Search GitHub
    results = await github.search_repositories(query, page=page)

    # Cache results
    await cache.cache_search_results(query, page, results)
else:
    results = cached

for repo in results['items']:
    print(f"{repo['full_name']}: {repo['stargazers_count']} stars")
```

### Example 3: Queue Background Sync

```python
from app.workers.sync_repos import sync_repository

# Queue repository sync
task = sync_repository.delay("microsoft", "vscode")

# Check task status
print(f"Task ID: {task.id}")
print(f"Status: {task.status}")

# Get result (blocks until complete)
result = task.get(timeout=30)
print(result)
```

### Example 4: Monitor API Usage

```python
from app.services.api_usage_service import get_api_usage_service

usage = get_api_usage_service()

# Get dashboard
dashboard = await usage.get_dashboard_data()

print(f"Today's calls: {dashboard['today']['total_calls']}")
print(f"Rate limit: {dashboard['rate_limit']['remaining']}/{dashboard['rate_limit']['limit']}")

# Check alerts
for alert in dashboard['alerts']:
    print(f"Alert: {alert['message']}")
```

## Rate Limit Management

GitHub API rate limits:
- **Unauthenticated**: 60 requests/hour
- **Authenticated**: 5,000 requests/hour
- **GraphQL**: 5,000 points/hour

**Best Practices:**
1. Always use caching to minimize API calls
2. Use GraphQL for bulk operations
3. Monitor rate limits via `get_rate_limit_status()`
4. Configure Celery Beat intervals based on your rate limits
5. Use webhooks for real-time updates instead of polling

## Monitoring & Debugging

### Celery Task Status

```bash
# Monitor Celery workers
celery -A app.workers.celery inspect active

# See scheduled tasks
celery -A app.workers.celery inspect scheduled

# Check registered tasks
celery -A app.workers.celery inspect registered
```

### Redis Monitoring

```bash
# Connect to Redis CLI
redis-cli

# Check keys
KEYS reponexus:*

# Get cache stats
INFO stats

# Monitor commands in real-time
MONITOR
```

### API Usage Dashboard

Access the API usage dashboard at:
```
GET /api/v1/admin/usage/dashboard
```

## Performance Optimization

1. **Caching Strategy**: Different TTLs for different data types
2. **Batch Operations**: Use GraphQL for bulk fetches
3. **Queue Priority**: High-priority tasks for trending data
4. **Rate Limit Buffer**: Keep 10% buffer to avoid hitting limits
5. **Circuit Breaker**: Prevents cascading failures
6. **Connection Pooling**: Reuse HTTP connections

## Troubleshooting

### Issue: Rate Limit Exceeded

**Solution:**
- Check current status: `service.get_rate_limit_status()`
- Wait for reset: `await limiter.wait_if_needed()`
- Use authenticated requests (5000/hour vs 60/hour)
- Implement better caching

### Issue: Celery Tasks Not Running

**Solution:**
- Check if worker is running: `celery -A app.workers.celery inspect active`
- Verify Redis connection: `redis-cli ping`
- Check task routing in `celery.py`
- View worker logs for errors

### Issue: Circuit Breaker Open

**Solution:**
- Check GitHub API status: https://www.githubstatus.com/
- View error logs for failure reasons
- Manually reset: `service.reset_circuit_breaker()`
- Wait for timeout (default 60 seconds)

### Issue: Webhook Signature Verification Failed

**Solution:**
- Verify `GITHUB_CLIENT_SECRET` is set correctly
- Check webhook secret in GitHub settings matches
- Ensure raw body is used for signature verification
- Test with manual trigger endpoint

## Files Created

```
backend/
├── app/
│   ├── services/
│   │   ├── __init__.py
│   │   ├── github_service.py          # Main GitHub REST API client
│   │   ├── github_graphql.py          # GraphQL client
│   │   ├── cache_service.py           # Redis caching layer
│   │   └── api_usage_service.py       # API usage tracking
│   ├── workers/
│   │   ├── __init__.py
│   │   ├── celery.py                  # Celery app config
│   │   ├── sync_repos.py              # Repository sync workers
│   │   ├── sync_trending.py           # Trending sync workers
│   │   ├── sync_topics.py             # Topic sync workers
│   │   └── celery_beat.py             # Scheduled tasks
│   └── api/
│       └── v1/
│           └── webhooks.py            # Webhook handler
├── tests/
│   └── services/
│       ├── __init__.py
│       ├── test_github_service.py     # GitHub service tests
│       ├── test_cache_service.py      # Cache service tests
│       └── test_api_usage_service.py  # API usage tests
└── requirements-github.txt            # New dependencies

Documentation:
└── GITHUB_INTEGRATION.md              # This file
```

## Summary

✅ **120+ tasks completed** across Phase 5 specification:
- Complete REST API integration with rate limiting, retries, and circuit breaker
- GraphQL client for efficient bulk operations
- Intelligent caching layer with Redis
- Background workers for async data synchronization
- Scheduled tasks for automated updates
- Real-time webhook handling
- API usage tracking and monitoring
- Comprehensive test suite

The GitHub integration service is production-ready and provides a robust foundation for the Repo Nexus platform.
