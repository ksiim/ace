"""sa_relationship in participant

Revision ID: 177cf71c2fa7
Revises: 32fa2c6d804d
Create Date: 2025-02-15 17:50:29.541323

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '177cf71c2fa7'
down_revision: Union[str, None] = '32fa2c6d804d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('tournament_participants', 'confirmed')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('tournament_participants', sa.Column('confirmed', sa.BOOLEAN(), autoincrement=False, nullable=False))
    # ### end Alembic commands ###
