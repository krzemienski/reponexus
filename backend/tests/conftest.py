"""
Pytest configuration and fixtures for testing
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool
from httpx import AsyncClient
from fakeredis import FakeAsyncRedis

from app.main import app
from app.core.db import Base, get_db
from app.core.cache import get_redis
from app.core.config import settings

# Test database URL (use in-memory SQLite for tests)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """
    Create an event loop for the test session
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Create a test database session
    """
    # Create async engine
    engine = create_async_engine(
        TEST_DATABASE_URL,
        poolclass=NullPool,
    )

    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session
    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:
        yield session

    # Drop tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture(scope="function")
def fake_redis():
    """
    Create a fake Redis client for testing
    """
    return FakeAsyncRedis()


@pytest.fixture(scope="function")
async def client(test_db: AsyncSession, fake_redis: FakeAsyncRedis) -> AsyncGenerator[AsyncClient, None]:
    """
    Create a test client with database and Redis overrides
    """

    # Override dependencies
    async def override_get_db():
        yield test_db

    async def override_get_redis():
        return fake_redis

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_redis] = override_get_redis

    # Create async client
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    # Clear overrides
    app.dependency_overrides.clear()


@pytest.fixture
def mock_github_user():
    """
    Mock GitHub user data
    """
    return {
        "id": 12345678,
        "login": "testuser",
        "name": "Test User",
        "email": "test@example.com",
        "avatar_url": "https://avatars.githubusercontent.com/u/12345678",
        "bio": "Test user bio",
        "company": "Test Company",
        "location": "Test Location",
        "blog": "https://test.com",
        "twitter_username": "testuser",
        "public_repos": 10,
        "public_gists": 5,
        "followers": 100,
        "following": 50,
    }


@pytest.fixture
def mock_github_token():
    """
    Mock GitHub access token
    """
    return "gho_test_access_token_1234567890"


@pytest.fixture
def mock_oauth_code():
    """
    Mock OAuth authorization code
    """
    return "test_oauth_code_1234567890"


@pytest.fixture
async def sample_user(test_db: AsyncSession):
    """Create a sample user for testing"""
    from app.models.user import User
    from datetime import datetime
    from uuid import uuid4

    user = User(
        id=uuid4(),
        github_id="test_github_id",
        login="testuser",
        name="Test User",
        email="test@example.com",
        avatar_url="https://example.com/avatar.jpg",
        bio="Test bio",
        public_repos=10,
        followers=100,
        following=50,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    return user


@pytest.fixture
async def auth_headers(sample_user):
    """Create authentication headers for testing"""
    from app.core.security import create_access_token

    access_token = create_access_token(user_id=str(sample_user.id))
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
async def sample_repositories(test_db: AsyncSession):
    """Create sample repositories for testing"""
    from app.models.repository import Repository
    from datetime import datetime
    from uuid import uuid4

    repositories = []
    for i in range(10):
        repo = Repository(
            id=uuid4(),
            github_id=f"gh_repo_{i}",
            node_id=f"node_{i}",
            name=f"test-repo-{i}",
            name_with_owner=f"testuser/test-repo-{i}",
            owner_login="testuser",
            description=f"Test repository {i}",
            is_private=False,
            is_fork=False,
            is_archived=False,
            stargazer_count=1000 + i * 100,
            watcher_count=500,
            fork_count=100,
            open_issues_count=10,
            primary_language="Python" if i % 2 == 0 else "JavaScript",
            languages={"Python": 5000, "Other": 1000},
            topics=["test", "python", "api"],
            html_url=f"https://github.com/testuser/test-repo-{i}",
            api_url=f"https://api.github.com/repos/testuser/test-repo-{i}",
            clone_url=f"https://github.com/testuser/test-repo-{i}.git",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            pushed_at=datetime.utcnow(),
            last_fetched_at=datetime.utcnow(),
            trending_score=1000 - i * 10,
            quality_score=80,
        )
        repositories.append(repo)
        test_db.add(repo)

    await test_db.commit()
    for repo in repositories:
        await test_db.refresh(repo)
    return repositories


@pytest.fixture
async def sample_topics(test_db: AsyncSession):
    """Create sample topics for testing"""
    from app.models.topic import Topic
    from datetime import datetime
    from uuid import uuid4

    topics = []
    for i in range(5):
        topic = Topic(
            id=uuid4(),
            name=f"test-topic-{i}",
            display_name=f"Test Topic {i}",
            description=f"Test topic description {i}",
            repository_count=10 + i,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        topics.append(topic)
        test_db.add(topic)

    await test_db.commit()
    for topic in topics:
        await test_db.refresh(topic)
    return topics
