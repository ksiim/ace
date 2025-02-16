"""organizer boolean column

Revision ID: fcac3e96feb1
Revises: 177cf71c2fa7
Create Date: 2025-02-15 18:18:19.583016

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fcac3e96feb1'
down_revision: Union[str, None] = '177cf71c2fa7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('users', sa.Column('organizer', sa.Boolean(), nullable=True, default=False))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('users', 'organizer')
    # ### end Alembic commands ###
