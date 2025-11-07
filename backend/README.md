# Repo Nexus Backend

FastAPI backend for Repo Nexus - A GitHub exploration platform.

## Features

- FastAPI with async/await support
- PostgreSQL database with SQLAlchemy ORM
- Redis for caching and session storage
- Celery for background tasks
- JWT authentication
- GraphQL API support
- Comprehensive API documentation

## Prerequisites

- Python 3.12+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (optional)

## Getting Started

### Local Development

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
# Update environment variables in .env
```

4. Start PostgreSQL and Redis (or use Docker):
```bash
# Using Docker
docker-compose up postgres redis -d
```

5. Run database migrations:
```bash
alembic upgrade head
```

6. Start the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

7. Access the API:
- API Documentation: http://localhost:8000/docs
- Alternative Docs: http://localhost:8000/redoc
- Health Check: http://localhost:8000/health

### Docker Development

1. Build and start all services:
```bash
docker-compose up --build
```

2. Access the API at http://localhost:8000

## Project Structure

```
backend/
├── alembic/                # Database migrations
│   └── versions/          # Migration files
├── app/
│   ├── api/               # API routes
│   │   └── v1/           # API v1 endpoints
│   ├── core/             # Core functionality
│   │   ├── config.py    # Configuration
│   │   ├── db.py        # Database setup
│   │   ├── security.py  # Authentication
│   │   └── cache.py     # Caching
│   ├── models/           # SQLAlchemy models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   ├── workers/          # Celery tasks
│   ├── dependencies.py   # FastAPI dependencies
│   └── main.py          # Application entry
├── tests/                # Tests
├── Dockerfile           # Docker configuration
├── docker-compose.yml   # Docker Compose config
└── requirements.txt     # Python dependencies
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - OAuth login
- `POST /api/v1/auth/callback` - OAuth callback
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Repositories
- `GET /api/v1/repositories` - List repositories
- `GET /api/v1/repositories/trending` - Trending repositories
- `GET /api/v1/repositories/{id}` - Get repository
- `POST /api/v1/repositories/{id}/star` - Star repository
- `DELETE /api/v1/repositories/{id}/star` - Unstar repository

### Topics
- `GET /api/v1/topics` - List topics
- `GET /api/v1/topics/{id}` - Get topic
- `POST /api/v1/topics/{id}/follow` - Follow topic
- `DELETE /api/v1/topics/{id}/follow` - Unfollow topic

### Users
- `GET /api/v1/users/me` - Get current user
- `PATCH /api/v1/users/me` - Update profile
- `GET /api/v1/users/me/starred` - Starred repositories
- `GET /api/v1/users/me/topics` - Followed topics

### Search
- `GET /api/v1/search/repositories` - Search repositories
- `GET /api/v1/search/topics` - Search topics
- `GET /api/v1/search/users` - Search users

## Testing

Run tests:
```bash
pytest

# With coverage
pytest --cov=app --cov-report=html

# Specific test file
pytest tests/test_auth.py
```

## Database Migrations

Create a new migration:
```bash
alembic revision --autogenerate -m "description"
```

Apply migrations:
```bash
alembic upgrade head
```

Rollback migration:
```bash
alembic downgrade -1
```

## Celery Tasks

Start Celery worker:
```bash
celery -A app.workers.celery worker --loglevel=info
```

Start Celery beat (scheduler):
```bash
celery -A app.workers.celery beat --loglevel=info
```

Monitor with Flower:
```bash
celery -A app.workers.celery flower
```

## Environment Variables

See `.env.example` for all available environment variables.

## License

MIT License

## Version

Current version: 1.0.0
