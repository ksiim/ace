from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from sqlalchemy.orm import selectinload

from common.db.models.group import GroupParticipant, GroupParticipantCreate
from common.db.models.participant import TournamentParticipant


async def add_participant(
    data: GroupParticipantCreate,
    session: AsyncSession,
) -> GroupParticipant:
    participant = GroupParticipant(**data.model_dump())
    session.add(participant)
    await session.commit()
    await session.refresh(participant)
    return participant


async def remove_participant(
    participant: GroupParticipant,
    session: AsyncSession,
):
    await session.delete(participant)
    await session.commit()


async def get_participants_by_group(
    group_id: int,
    session: AsyncSession,
) -> list[GroupParticipant]:
    query = (
        select(GroupParticipant)
        .where(GroupParticipant.group_id == group_id)
        .options(
            selectinload(GroupParticipant.participant).selectinload(
                TournamentParticipant.matches_as_p1
            ),
            selectinload(GroupParticipant.participant).selectinload(
                TournamentParticipant.matches_as_p2
            ),
        )
    )
    result = await session.execute(query)
    return result.scalars().all()


async def get_participants_by_tournament(
    tournament_id: int,
    session: AsyncSession,
) -> list[GroupParticipant]:
    query = select(GroupParticipant).where(GroupParticipant.group.has(tournament_id=tournament_id))
    result = await session.execute(query)
    return result.scalars().all()
