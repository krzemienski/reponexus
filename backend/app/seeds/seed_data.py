"""
Seed data for development and testing
"""

from datetime import datetime, timedelta
from uuid import uuid4
import asyncio

from app.core.db import get_session, engine
from app.models.user import User
from app.models.repository import Repository
from app.models.topic import Topic, UserTopic
from app.models.starred_repository import StarredRepository


async def seed_database():
    """Seed the database with sample data"""

    print("🌱 Seeding database...")

    async with get_session() as db:
        # Create sample users
        users = [
            User(
                id=uuid4(),
                github_id=f"gh_user_{i}",
                login=f"testuser{i}",
                name=f"Test User {i}",
                email=f"testuser{i}@example.com",
                avatar_url=f"https://avatars.githubusercontent.com/u/{i}",
                bio=f"Sample bio for test user {i}",
                company=f"Company {i}",
                location=f"City {i}",
                public_repos=10 + i,
                followers=100 + i * 10,
                following=50 + i * 5,
                created_at=datetime.utcnow() - timedelta(days=365),
                updated_at=datetime.utcnow(),
            )
            for i in range(1, 11)
        ]

        for user in users:
            db.add(user)

        await db.commit()
        print(f"✅ Created {len(users)} users")

        # Create sample topics
        topics_data = [
            ("javascript", "JavaScript", "The programming language of the web"),
            ("python", "Python", "General purpose programming language"),
            ("react", "React", "A JavaScript library for building user interfaces"),
            ("typescript", "TypeScript", "TypeScript is a superset of JavaScript"),
            ("machine-learning", "Machine Learning", "Machine Learning algorithms and frameworks"),
            ("docker", "Docker", "Containerization platform"),
            ("kubernetes", "Kubernetes", "Container orchestration"),
            ("web-development", "Web Development", "Web development tools and frameworks"),
            ("frontend", "Frontend", "Frontend development"),
            ("backend", "Backend", "Backend development"),
            ("api", "API", "API design and development"),
            ("database", "Database", "Database systems and tools"),
            ("devops", "DevOps", "DevOps practices and tools"),
            ("cloud", "Cloud", "Cloud computing platforms"),
            ("security", "Security", "Security best practices"),
            ("testing", "Testing", "Testing frameworks and practices"),
            ("ai", "AI", "Artificial Intelligence"),
            ("mobile", "Mobile", "Mobile app development"),
            ("data-science", "Data Science", "Data Science and Analytics"),
            ("open-source", "Open Source", "Open source projects"),
        ]

        topics = []
        for name, display_name, description in topics_data:
            topic = Topic(
                id=uuid4(),
                name=name,
                display_name=display_name,
                description=description,
                repository_count=0,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            topics.append(topic)
            db.add(topic)

        await db.commit()
        print(f"✅ Created {len(topics)} topics")

        # Create sample repositories
        languages = ["TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "C++", "Ruby", "PHP", "C#"]
        repo_names = [
            ("awesome-project", "An awesome project for developers"),
            ("web-framework", "Modern web framework"),
            ("api-client", "HTTP API client library"),
            ("data-analyzer", "Data analysis toolkit"),
            ("ml-toolkit", "Machine learning toolkit"),
            ("ui-components", "Beautiful UI components"),
            ("testing-framework", "Testing framework for modern apps"),
            ("build-tool", "Build and bundling tool"),
            ("auth-service", "Authentication and authorization service"),
            ("monitoring-system", "System monitoring and alerting"),
            ("cache-library", "High-performance caching library"),
            ("orm-framework", "Object-relational mapping framework"),
            ("cli-tool", "Command-line interface tool"),
            ("container-manager", "Container management system"),
            ("search-engine", "Full-text search engine"),
            ("message-queue", "Message queue system"),
            ("static-site-gen", "Static site generator"),
            ("code-editor", "Code editor and IDE"),
            ("database-driver", "Database driver"),
            ("api-gateway", "API Gateway"),
        ]

        repositories = []
        for i, (name, description) in enumerate(repo_names):
            owner = users[i % len(users)].login
            language = languages[i % len(languages)]
            selected_topics = [topics[j % len(topics)].name for j in range(i, i + 3)]

            repo = Repository(
                id=uuid4(),
                github_id=f"gh_repo_{i}",
                node_id=f"node_{i}",
                name=name,
                name_with_owner=f"{owner}/{name}",
                owner_login=owner,
                description=description,
                is_private=False,
                is_fork=i % 4 == 0,
                is_archived=False,
                stargazer_count=1000 + i * 100,
                watcher_count=500 + i * 50,
                fork_count=100 + i * 10,
                open_issues_count=10 + i,
                primary_language=language,
                languages={language: 10000 - i * 100, "Other": 1000},
                topics=selected_topics,
                html_url=f"https://github.com/{owner}/{name}",
                api_url=f"https://api.github.com/repos/{owner}/{name}",
                clone_url=f"https://github.com/{owner}/{name}.git",
                created_at=datetime.utcnow() - timedelta(days=365 - i * 10),
                updated_at=datetime.utcnow() - timedelta(days=i),
                pushed_at=datetime.utcnow() - timedelta(days=i),
                last_fetched_at=datetime.utcnow(),
                trending_score=1000 - i * 10,
                quality_score=80 + (i % 20),
            )
            repositories.append(repo)
            db.add(repo)

        await db.commit()
        print(f"✅ Created {len(repositories)} repositories")

        # Update repository counts for topics
        for topic in topics:
            count = sum(1 for repo in repositories if topic.name in repo.topics)
            topic.repository_count = count

        await db.commit()
        print("✅ Updated topic repository counts")

        # Create user-topic relationships (follows)
        user_topics = []
        for i, user in enumerate(users[:5]):  # First 5 users follow topics
            for j in range(i, i + 5):
                topic = topics[j % len(topics)]
                user_topic = UserTopic(
                    id=uuid4(),
                    user_id=user.id,
                    topic_id=topic.id,
                    is_following=True,
                    notification_enabled=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                user_topics.append(user_topic)
                db.add(user_topic)

        await db.commit()
        print(f"✅ Created {len(user_topics)} user-topic relationships")

        # Create starred repositories
        starred = []
        for i, user in enumerate(users[:5]):  # First 5 users star repos
            for j in range(i * 4, i * 4 + 4):
                repo = repositories[j % len(repositories)]
                star = StarredRepository(
                    id=uuid4(),
                    user_id=user.id,
                    repository_id=repo.id,
                    starred_at=datetime.utcnow() - timedelta(days=j),
                )
                starred.append(star)
                db.add(star)

        await db.commit()
        print(f"✅ Created {len(starred)} starred repository relationships")

    print("🎉 Database seeding completed successfully!")
    print(f"   - {len(users)} users")
    print(f"   - {len(topics)} topics")
    print(f"   - {len(repositories)} repositories")
    print(f"   - {len(user_topics)} user-topic follows")
    print(f"   - {len(starred)} starred repositories")


async def clear_database():
    """Clear all data from the database"""
    print("🗑️  Clearing database...")

    async with get_session() as db:
        # Delete in reverse order of dependencies
        await db.execute("DELETE FROM starred_repositories")
        await db.execute("DELETE FROM user_topics")
        await db.execute("DELETE FROM analytics_events")
        await db.execute("DELETE FROM audit_logs")
        await db.execute("DELETE FROM repositories")
        await db.execute("DELETE FROM topics")
        await db.execute("DELETE FROM users")
        await db.commit()

    print("✅ Database cleared")


async def main():
    """Main function"""
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "clear":
        await clear_database()
    else:
        await clear_database()
        await seed_database()


if __name__ == "__main__":
    asyncio.run(main())
