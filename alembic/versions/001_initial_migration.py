"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('role', postgresql.ENUM('police', 'admin', name='userrole'), nullable=False),
        sa.Column('is_approved', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('phone', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    # Create ids table
    op.create_table('ids',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('dl_code', sa.String(), nullable=False),
        sa.Column('photo', sa.Text(), nullable=True),
        sa.Column('id_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ids_dl_code'), 'ids', ['dl_code'], unique=True)
    
    # Create logs table
    op.create_table('logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('police_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('dl_code_checked', sa.String(), nullable=True),
        sa.Column('verification_result', postgresql.ENUM('legit', 'fake', 'unknown', name='verificationresult'), nullable=False),
        sa.Column('image_similarity', sa.Float(), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('image_url_or_blob', sa.Text(), nullable=True),
        sa.Column('parsed_fields', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('extra', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['police_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('logs')
    op.drop_table('ids')
    op.drop_table('users')
    op.execute('DROP TYPE verificationresult')
    op.execute('DROP TYPE userrole')
