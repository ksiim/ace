"""migrations

Revision ID: 83c8686a1698
Revises: 1b9976879e83
Create Date: 2025-01-13 15:26:00.104020

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '83c8686a1698'
down_revision: Union[str, None] = '1b9976879e83'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('categories', sa.Column('child', sa.Boolean(), nullable=True))
    op.add_column('tournaments_solo', sa.Column('organizer_name_and_contacts', sa.String(), nullable=True))
    op.drop_column('tournaments_solo', 'organizer_name')
    op.drop_column('tournaments_solo', 'organizer_contacts')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('tournaments_solo', sa.Column('organizer_contacts', sa.VARCHAR(), nullable=True))
    op.add_column('tournaments_solo', sa.Column('organizer_name', sa.VARCHAR(), nullable=False))
    op.drop_column('tournaments_solo', 'organizer_name_and_contacts')
    op.drop_column('categories', 'child')
    # ### end Alembic commands ###
