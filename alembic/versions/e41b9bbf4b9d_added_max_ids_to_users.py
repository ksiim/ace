"""added max ids to users

Revision ID: e41b9bbf4b9d
Revises: c2f5ba8dac86
Create Date: 2026-05-10 19:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e41b9bbf4b9d'
down_revision: Union[str, None] = 'c2f5ba8dac86'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('max_user_id', sa.BigInteger(), nullable=True))
    op.add_column('users', sa.Column('max_chat_id', sa.BigInteger(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'max_chat_id')
    op.drop_column('users', 'max_user_id')

