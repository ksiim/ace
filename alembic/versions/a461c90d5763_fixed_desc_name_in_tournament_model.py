"""fixed desc name in tournament model

Revision ID: a461c90d5763
Revises: 5958d3eda25b
Create Date: 2025-03-16 22:47:51.290629

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = 'a461c90d5763'
down_revision: Union[str, None] = '5958d3eda25b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('tournaments', sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.drop_column('tournaments', 'desctiption')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('tournaments', sa.Column('desctiption', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.drop_column('tournaments', 'description')
    # ### end Alembic commands ###
