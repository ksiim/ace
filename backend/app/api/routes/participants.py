from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, update
from sqlmodel import col, delete, func, select

from backend.app import crud
from backend.app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
    get_current_user,
)
from common.db.models import (
    Message, TournamentParticipant, TournamentParticipantCreate,
    TournamentParticipantPublic, TournamentParticipantUpdate,
    TournamentParticipantsPublic
)

router = APIRouter()


@router.get(
    "/",
    dependencies=[Depends(get_current_user)],
    response_model=TournamentParticipantsPublic,
)
async def read_tournament_participants(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve tournament participants.
    """
    count_statement = select(func.count()).select_from(TournamentParticipant)
    count = (await session.execute(count_statement)).scalar_one_or_none()

    statement = select(TournamentParticipant).offset(skip).limit(limit)
    participants = (await session.execute(statement)).scalars().all()

    return TournamentParticipantsPublic(data=participants, count=count)


@router.get(
    '/{participant_id}',
    dependencies=[Depends(get_current_user)],
    response_model=TournamentParticipantPublic,
)
async def read_tournament_participant(
    session: SessionDep,
    participant_id: int,
) -> Any:
    """
    Retrieve tournament participant by id.
    """
    statement = select(TournamentParticipant).where(
        TournamentParticipant.id == participant_id)
    participant = (await session.execute(statement)).scalar_one_or_none()

    if not participant:
        raise HTTPException(
            status_code=404, detail="Tournament participant not found")

    return participant


@router.post(
    "/",
    dependencies=[Depends(get_current_user)],
    response_model=TournamentParticipantPublic,
)
async def create_tournament_participant(
    participant_in: TournamentParticipantCreate,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Create a new tournament participant.
    """
    participant = await crud.create_tournament_participant(session, participant_in)
    return participant


@router.put(
    '/{participant_id}',
    dependencies=[Depends(get_current_user)],
    response_model=TournamentParticipantPublic,
)
async def update_tournament_participant(
    session: SessionDep,
    participant_id: int,
    participant_in: TournamentParticipantUpdate,
) -> Any:
    """
    Update tournament participant by id.
    """
    participant = await session.get(TournamentParticipant, participant_id)

    if not participant:
        raise HTTPException(
            status_code=404, detail="Tournament participant not found")

    participant = await crud.update_tournament_participant(
        session=session,
        db_tournament_participant=participant,
        tournament_participant_in=participant_in
    )
    return participant

@router.delete(
    '/{participant_id}',
    dependencies=[Depends(get_current_user)],
)
async def delete_tournament_participant(
    session: SessionDep,
    participant_id: int,
) -> Any:
    """
    Delete tournament participant by id.
    """
    tournament_participant = await session.get(TournamentParticipant, participant_id)
    if not tournament_participant:
        raise HTTPException(
            status_code=404, detail="Tournament participant not found")
    await session.delete(tournament_participant)
    await session.commit()
    return {"message": "Tournament participant deleted successfully"}
