"""add search history, notifications, and settings

Revision ID: 002
Revises: 001
Create Date: 2025-11-08 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create search_history table
    op.create_table('search_history',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('query', sa.String(), nullable=False),
        sa.Column('result_type', sa.Enum('repository', 'topic', 'user', name='searchresulttype'), nullable=False),
        sa.Column('result_count', sa.Integer(), nullable=False, default=0),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    )
    op.create_index('idx_search_history_user_created', 'search_history', ['user_id', 'created_at'])
    op.create_index('idx_search_history_query', 'search_history', ['query'])
    op.create_index('ix_search_history_user_id', 'search_history', ['user_id'])

    # Create notifications table
    op.create_table('notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.Enum('star', 'follow', 'mention', 'system', name='notificationtype'), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('message', sa.String(), nullable=False),
        sa.Column('link', sa.String(), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    )
    op.create_index('idx_notifications_user_read', 'notifications', ['user_id', 'is_read'])
    op.create_index('idx_notifications_created', 'notifications', ['created_at'])
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'])

    # Create settings table
    op.create_table('settings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('theme', sa.Enum('light', 'dark', 'auto', name='themetype'), nullable=False, default='auto'),
        sa.Column('notifications_enabled', sa.Boolean(), nullable=False, default=True),
        sa.Column('email_notifications', sa.Boolean(), nullable=False, default=True),
        sa.Column('language', sa.String(), nullable=False, default='en'),
        sa.Column('timezone', sa.String(), nullable=False, default='UTC'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.UniqueConstraint('user_id', name='uq_settings_user_id'),
    )
    op.create_index('ix_settings_user_id', 'settings', ['user_id'], unique=True)


def downgrade() -> None:
    # Drop settings table
    op.drop_index('ix_settings_user_id', table_name='settings')
    op.drop_table('settings')
    op.execute('DROP TYPE themetype')

    # Drop notifications table
    op.drop_index('ix_notifications_is_read', table_name='notifications')
    op.drop_index('ix_notifications_user_id', table_name='notifications')
    op.drop_index('idx_notifications_created', table_name='notifications')
    op.drop_index('idx_notifications_user_read', table_name='notifications')
    op.drop_table('notifications')
    op.execute('DROP TYPE notificationtype')

    # Drop search_history table
    op.drop_index('ix_search_history_user_id', table_name='search_history')
    op.drop_index('idx_search_history_query', table_name='search_history')
    op.drop_index('idx_search_history_user_created', table_name='search_history')
    op.drop_table('search_history')
    op.execute('DROP TYPE searchresulttype')
