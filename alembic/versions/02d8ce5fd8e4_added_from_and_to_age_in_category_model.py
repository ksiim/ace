"""added from and to age in category model

Revision ID: 02d8ce5fd8e4
Revises: a461c90d5763
Create Date: 2025-03-18 13:07:48.775566

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '02d8ce5fd8e4'
down_revision: Union[str, None] = 'a461c90d5763'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('categories', sa.Column('from_age', sa.Integer(), nullable=True))
    op.add_column('categories', sa.Column('to_age', sa.Integer(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('categories', 'to_age')
    op.drop_column('categories', 'from_age')
    # ### end Alembic commands ###
