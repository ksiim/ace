from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from common.db.models.participant import (
    TournamentParticipant,
    TournamentParticipantCreate,
    TournamentParticipantPublic
)
from common.db.models.user import User


async def create_tournament_participant(session: AsyncSession, tournament_participant_in: TournamentParticipantCreate) -> TournamentParticipantPublic:
    db_obj = TournamentParticipant.model_validate(tournament_participant_in)
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def update_tournament_participant(
    *, session: AsyncSession,
    db_tournament_participant: TournamentParticipant,
    tournament_participant_in: TournamentParticipant
) -> TournamentParticipantPublic:
    tournament_participant_data = tournament_participant_in.model_dump(
        exclude_unset=True
    )
    db_tournament_participant.sqlmodel_update(tournament_participant_data)
    session.add(db_tournament_participant)
    await session.commit()
    await session.refresh(db_tournament_participant)
    return db_tournament_participant
