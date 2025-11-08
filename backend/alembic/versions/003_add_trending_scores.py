"""add trending scores table

Revision ID: 003
Revises: 002
Create Date: 2025-11-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create trending_scores table
    op.create_table('trending_scores',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('repository_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('topic_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('trending_score', sa.Float(), nullable=False, default=0.0),
        sa.Column('star_growth_rate', sa.Float(), nullable=False, default=0.0),
        sa.Column('activity_score', sa.Float(), nullable=False, default=0.0),
        sa.Column('community_score', sa.Float(), nullable=False, default=0.0),
        sa.Column('recency_score', sa.Float(), nullable=False, default=0.0),
        sa.Column('quality_score', sa.Float(), nullable=False, default=0.0),
        sa.Column('time_window', sa.String(length=20), nullable=False),
        sa.Column('calculated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['repository_id'], ['repositories.id'], ),
        sa.ForeignKeyConstraint(['topic_id'], ['topics.id'], ),
    )

    # Create indexes
    op.create_index('ix_trending_scores_repository_id', 'trending_scores', ['repository_id'])
    op.create_index('ix_trending_scores_topic_id', 'trending_scores', ['topic_id'])
    op.create_index('ix_trending_scores_trending_score', 'trending_scores', ['trending_score'])
    op.create_index('ix_trending_scores_time_window', 'trending_scores', ['time_window'])

    # Create composite indexes for efficient queries
    op.create_index('ix_trending_topic_window_score', 'trending_scores', ['topic_id', 'time_window', 'trending_score'])
    op.create_index('ix_trending_repo_topic_window', 'trending_scores', ['repository_id', 'topic_id', 'time_window'], unique=True)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_trending_repo_topic_window', table_name='trending_scores')
    op.drop_index('ix_trending_topic_window_score', table_name='trending_scores')
    op.drop_index('ix_trending_scores_time_window', table_name='trending_scores')
    op.drop_index('ix_trending_scores_trending_score', table_name='trending_scores')
    op.drop_index('ix_trending_scores_topic_id', table_name='trending_scores')
    op.drop_index('ix_trending_scores_repository_id', table_name='trending_scores')

    # Drop table
    op.drop_table('trending_scores')
