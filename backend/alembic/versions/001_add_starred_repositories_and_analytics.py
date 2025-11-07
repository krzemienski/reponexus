"""add starred repositories and analytics

Revision ID: 001
Revises:
Create Date: 2025-11-07 18:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('github_id', sa.String(), nullable=False),
        sa.Column('login', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('avatar_url', sa.String(), nullable=True),
        sa.Column('bio', sa.String(), nullable=True),
        sa.Column('company', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('blog', sa.String(), nullable=True),
        sa.Column('twitter_username', sa.String(), nullable=True),
        sa.Column('public_repos', sa.Integer(), default=0),
        sa.Column('public_gists', sa.Integer(), default=0),
        sa.Column('followers', sa.Integer(), default=0),
        sa.Column('following', sa.Integer(), default=0),
        sa.Column('access_token', sa.String(), nullable=True),
        sa.Column('refresh_token', sa.String(), nullable=True),
        sa.Column('token_expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_users_github_id', 'users', ['github_id'], unique=True)
    op.create_index('ix_users_login', 'users', ['login'], unique=True)

    # Create repositories table
    op.create_table('repositories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('github_id', sa.String(), nullable=False),
        sa.Column('node_id', sa.String(), nullable=False),
        sa.Column('name_with_owner', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('owner_login', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('is_private', sa.Boolean(), default=False),
        sa.Column('is_fork', sa.Boolean(), default=False),
        sa.Column('is_archived', sa.Boolean(), default=False),
        sa.Column('stargazer_count', sa.Integer(), default=0),
        sa.Column('watcher_count', sa.Integer(), default=0),
        sa.Column('fork_count', sa.Integer(), default=0),
        sa.Column('open_issues_count', sa.Integer(), default=0),
        sa.Column('primary_language', sa.String(), nullable=True),
        sa.Column('languages', postgresql.JSON(), default=dict),
        sa.Column('topics', postgresql.JSON(), default=list),
        sa.Column('html_url', sa.String(), nullable=False),
        sa.Column('api_url', sa.String(), nullable=False),
        sa.Column('clone_url', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('pushed_at', sa.DateTime(), nullable=True),
        sa.Column('last_fetched_at', sa.DateTime(), nullable=False),
        sa.Column('trending_score', sa.Integer(), default=0),
        sa.Column('quality_score', sa.Integer(), default=0),
    )
    op.create_index('ix_repositories_github_id', 'repositories', ['github_id'], unique=True)
    op.create_index('ix_repositories_node_id', 'repositories', ['node_id'], unique=True)
    op.create_index('ix_repositories_name_with_owner', 'repositories', ['name_with_owner'])
    op.create_index('ix_repositories_name', 'repositories', ['name'])
    op.create_index('ix_repositories_owner_login', 'repositories', ['owner_login'])
    op.create_index('idx_repos_stars', 'repositories', ['stargazer_count'])
    op.create_index('idx_repos_language', 'repositories', ['primary_language'])
    op.create_index('idx_repos_trending', 'repositories', ['trending_score'])
    op.create_index('idx_repos_created', 'repositories', ['created_at'])

    # Create topics table
    op.create_table('topics',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('display_name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('repository_count', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_topics_name', 'topics', ['name'], unique=True)

    # Create user_topics table
    op.create_table('user_topics',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('topic_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('is_following', sa.Boolean(), default=True),
        sa.Column('notification_enabled', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ),
    )
    op.create_index('ix_user_topics_user_id', 'user_topics', ['user_id'])
    op.create_index('ix_user_topics_topic_id', 'user_topics', ['topic_id'])

    # Create starred_repositories table
    op.create_table('starred_repositories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('repository_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('starred_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['repository_id'], ['repositories.id'], ),
        sa.UniqueConstraint('user_id', 'repository_id', name='uq_user_repository_star'),
    )
    op.create_index('idx_starred_user', 'starred_repositories', ['user_id'])
    op.create_index('idx_starred_repo', 'starred_repositories', ['repository_id'])

    # Create analytics_events table
    op.create_table('analytics_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('event_type', sa.String(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=True),
        sa.Column('entity_id', sa.String(), nullable=True),
        sa.Column('metadata', postgresql.JSON(), default=dict),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('referrer', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    )
    op.create_index('idx_analytics_user', 'analytics_events', ['user_id'])
    op.create_index('idx_analytics_type', 'analytics_events', ['event_type'])
    op.create_index('idx_analytics_created', 'analytics_events', ['created_at'])

    # Create audit_logs table
    op.create_table('audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('resource_type', sa.String(), nullable=True),
        sa.Column('resource_id', sa.String(), nullable=True),
        sa.Column('details', postgresql.JSON(), default=dict),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('user_agent', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    )
    op.create_index('idx_audit_logs_user', 'audit_logs', ['user_id'])
    op.create_index('idx_audit_logs_action', 'audit_logs', ['action'])
    op.create_index('idx_audit_logs_created', 'audit_logs', ['created_at'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('analytics_events')
    op.drop_table('starred_repositories')
    op.drop_table('user_topics')
    op.drop_table('topics')
    op.drop_table('repositories')
    op.drop_table('users')
