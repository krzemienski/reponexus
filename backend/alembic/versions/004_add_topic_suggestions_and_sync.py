"""add topic suggestions and starred repo sync

Revision ID: 004
Revises: 003
Create Date: 2025-11-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add synced_at column to starred_repositories table
    op.add_column('starred_repositories',
        sa.Column('synced_at', sa.DateTime(), nullable=True)
    )

    # Create topic_suggestions table
    op.create_table('topic_suggestions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('topic_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('relevance_score', sa.Integer(), nullable=False, default=0),
        sa.Column('starred_repo_count', sa.Integer(), nullable=False, default=0),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('is_dismissed', sa.Boolean(), nullable=False, default=False),
        sa.Column('is_accepted', sa.Boolean(), nullable=False, default=False),
        sa.Column('suggested_at', sa.DateTime(), nullable=False),
        sa.Column('dismissed_at', sa.DateTime(), nullable=True),
        sa.Column('accepted_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ),
    )

    # Create indexes
    op.create_index('ix_topic_suggestions_user_id', 'topic_suggestions', ['user_id'])
    op.create_index('ix_topic_suggestions_topic_id', 'topic_suggestions', ['topic_id'])

    # Create composite indexes for efficient queries
    op.create_index('ix_topic_suggestions_user_relevance', 'topic_suggestions', ['user_id', 'relevance_score'])
    op.create_index('ix_topic_suggestions_user_dismissed', 'topic_suggestions', ['user_id', 'is_dismissed', 'is_accepted'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_topic_suggestions_user_dismissed', table_name='topic_suggestions')
    op.drop_index('ix_topic_suggestions_user_relevance', table_name='topic_suggestions')
    op.drop_index('ix_topic_suggestions_topic_id', table_name='topic_suggestions')
    op.drop_index('ix_topic_suggestions_user_id', table_name='topic_suggestions')

    # Drop table
    op.drop_table('topic_suggestions')

    # Remove synced_at column from starred_repositories
    op.drop_column('starred_repositories', 'synced_at')
