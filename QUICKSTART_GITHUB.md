# GitHub Integration - Quick Start Guide

## Prerequisites

- Python 3.11+
- Redis server
- PostgreSQL database (already configured)

## Installation

### 1. Install Dependencies

```bash
cd /home/user/reponexus/backend
pip install httpx beautifulsoup4 lxml celery kombu redis pytest pytest-asyncio
```

Or use the requirements file:
```bash
pip install -r requirements-github.txt
```

### 2. Configure Environment

Update your `.env` file:

```bash
# GitHub API Configuration
GITHUB_API_URL=https://api.github.com
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Redis Configuration (default)
REDIS_URL=redis://localhost:6379/0

# Celery Configuration (default)
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

## Running the Services

### Terminal 1: Start Redis

```bash
# Option 1: Using Docker
docker run -d --name reponexus-redis -p 6379:6379 redis:7-alpine

# Option 2: Local Redis
redis-server
```

### Terminal 2: Start Celery Worker

```bash
cd /home/user/reponexus/backend

# Start worker with all queues
celery -A app.workers.celery worker --loglevel=info --concurrency=4

# Or start with specific queues
celery -A app.workers.celery worker -Q repos,trending,topics --loglevel=info
```

### Terminal 3: Start Celery Beat (Scheduler)

```bash
cd /home/user/reponexus/backend

celery -A app.workers.celery beat --loglevel=info
```

### Terminal 4: Start FastAPI Server

```bash
cd /home/user/reponexus/backend

python -m app.main
```

## Quick Tests

### 1. Test API Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "environment": "development"
}
```

### 2. Test Webhook Endpoint

```bash
curl http://localhost:8000/api/v1/webhooks/github/test
```

Expected response:
```json
{
  "status": "ok",
  "message": "Webhook handler is operational",
  "timestamp": "2024-01-01T12:00:00"
}
```

### 3. Manually Trigger Repository Sync

```bash
curl -X POST http://localhost:8000/api/v1/webhooks/github/manual \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "sync",
    "owner": "facebook",
    "name": "react"
  }'
```

Expected response:
```json
{
  "status": "queued",
  "event": "sync",
  "repository": "facebook/react"
}
```

### 4. Check Celery Task Status

```bash
# View active tasks
celery -A app.workers.celery inspect active

# View scheduled tasks
celery -A app.workers.celery inspect scheduled

# View registered tasks
celery -A app.workers.celery inspect registered
```

## Using the Services in Python

### Example 1: Fetch Repository with Caching

```python
import asyncio
from app.services.github_service import get_github_service
from app.services.cache_service import get_cache_service

async def fetch_repo_cached(owner: str, name: str):
    github = get_github_service()
    cache = get_cache_service()

    # Try cache first
    cached = await cache.get_repository(owner, name)
    if cached:
        print("✅ Cache hit!")
        return cached

    # Fetch from GitHub
    print("📡 Fetching from GitHub...")
    data = await github.fetch_repository(owner, name)

    # Cache for 15 minutes
    await cache.cache_repository(owner, name, data)

    return data

# Run
repo = asyncio.run(fetch_repo_cached("facebook", "react"))
print(f"Repository: {repo['full_name']}")
print(f"Stars: {repo['stargazers_count']}")
```

### Example 2: Queue Background Tasks

```python
from app.workers.sync_repos import sync_repository
from app.workers.sync_trending import sync_trending
from app.workers.sync_topics import sync_topic

# Sync a repository
task = sync_repository.delay("microsoft", "vscode")
print(f"Task queued: {task.id}")

# Sync trending Python repos
sync_trending.delay("daily", "python")

# Sync machine learning topic
sync_topic.delay("machine-learning", fetch_repos=True)
```

### Example 3: Check API Usage

```python
import asyncio
from app.services.api_usage_service import get_api_usage_service

async def check_usage():
    usage = get_api_usage_service()

    # Get current rate limit
    rate_limit = await usage.get_current_rate_limit()
    print(f"Rate Limit: {rate_limit['remaining']}/{rate_limit['limit']}")

    # Get today's stats
    stats = await usage.get_today_stats()
    print(f"API Calls Today: {stats['total_calls']}")

    # Get dashboard
    dashboard = await usage.get_dashboard_data()
    print(f"Active Alerts: {len(dashboard['alerts'])}")

asyncio.run(check_usage())
```

## Running Tests

```bash
cd /home/user/reponexus/backend

# Run all service tests
pytest tests/services/ -v

# Run specific test file
pytest tests/services/test_github_service.py -v

# Run with coverage
pytest tests/services/ --cov=app/services --cov-report=html

# Open coverage report
open htmlcov/index.html
```

## Monitoring

### Redis Monitoring

```bash
# Connect to Redis
redis-cli

# Check cache keys
KEYS reponexus:*

# Get cache info
INFO stats

# Monitor in real-time
MONITOR
```

### Celery Monitoring

```bash
# Check worker status
celery -A app.workers.celery status

# View stats
celery -A app.workers.celery inspect stats

# View active queues
celery -A app.workers.celery inspect active_queues
```

## Common Operations

### Trigger Full Repository Sync

```python
from app.workers.sync_repos import sync_all_repositories

# Sync up to 1000 repositories
sync_all_repositories.delay(limit=1000)
```

### Update All Trending Data

```python
from app.workers.sync_trending import sync_all_trending

# Queue all trending sync tasks
sync_all_trending.delay()
```

### Discover and Sync Topics

```python
from app.workers.sync_topics import discover_topics, sync_all_topics

# Discover popular topics
discover_topics.delay()

# Then sync them
sync_all_topics.delay()
```

### Clear Old Cache Data

```python
import asyncio
from app.services.cache_service import get_cache_service

async def cleanup_cache():
    cache = get_cache_service()

    # Delete all user cache
    deleted = await cache.delete_pattern("reponexus:user:*")
    print(f"Deleted {deleted} user cache entries")

    # Delete all trending cache
    deleted = await cache.delete_pattern("reponexus:trending:*")
    print(f"Deleted {deleted} trending cache entries")

asyncio.run(cleanup_cache())
```

## Troubleshooting

### Issue: Connection Refused to Redis

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# If not running, start it
docker run -d --name reponexus-redis -p 6379:6379 redis:7-alpine

# Or
redis-server
```

### Issue: Celery Tasks Not Executing

**Solution:**
```bash
# Check if worker is running
celery -A app.workers.celery inspect active

# Check worker logs
celery -A app.workers.celery worker --loglevel=debug

# Purge all tasks and restart
celery -A app.workers.celery purge
celery -A app.workers.celery worker --loglevel=info
```

### Issue: Rate Limit Exceeded

**Solution:**
```python
# Check current rate limit status
from app.services.github_service import get_github_service

github = get_github_service()
status = github.get_rate_limit_status()
print(status)

# Wait until reset or use authentication
# Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env
```

### Issue: Circuit Breaker Open

**Solution:**
```python
# Reset circuit breaker manually
from app.services.github_service import get_github_service

github = get_github_service()
github.reset_circuit_breaker()
```

## Performance Tips

1. **Use Caching Aggressively**
   - Always check cache before API calls
   - Set appropriate TTLs

2. **Use GraphQL for Bulk Operations**
   - Fetch multiple repos in one query
   - Reduces API calls significantly

3. **Monitor Rate Limits**
   - Keep track of remaining calls
   - Use webhooks instead of polling

4. **Optimize Celery Beat Schedule**
   - Adjust frequencies based on your needs
   - Disable unnecessary tasks

5. **Use Task Priorities**
   - High priority for user-facing tasks
   - Low priority for maintenance

## Next Steps

1. **Configure GitHub OAuth**
   - Set up OAuth app in GitHub
   - Add client ID and secret to .env

2. **Set Up Webhooks**
   - Configure webhooks in GitHub repos
   - Use ngrok for local testing

3. **Monitor Production**
   - Set up Sentry for error tracking
   - Use Flower for Celery monitoring
   - Set up alerts for rate limits

4. **Scale Services**
   - Add more Celery workers
   - Use Redis Sentinel for HA
   - Load balance API servers

## Resources

- **Documentation**: `/home/user/reponexus/GITHUB_INTEGRATION.md`
- **API Docs**: `http://localhost:8000/docs`
- **Celery Docs**: https://docs.celeryproject.org/
- **GitHub API**: https://docs.github.com/en/rest

## Support

For issues or questions:
1. Check the troubleshooting guide above
2. Review the full documentation
3. Check Celery and worker logs
4. Monitor Redis for cache issues

---

**Quick Start Complete!** 🎉

You now have a fully functional GitHub integration service running locally.
