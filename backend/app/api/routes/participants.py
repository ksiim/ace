from typing import Any

from common.db.models.category import Category
from common.db.models.participant import (
    TournamentParticipant,
    TournamentParticipantCreate,
    TournamentParticipantPublic,
    TournamentParticipantUpdate,
    TournamentParticipantsPublic
)
from common.db.models.tournament import Tournament
from common.db.models.user import User
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from backend.app.crud import participant as participant_crud
from backend.app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_subscriber,
    get_current_user,
)

router = APIRouter()


@router.get(
    "/",
    # dependencies=[Depends(get_current_user)],
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
    count, participants = await participant_crud.get_all_tournament_participants(session, skip, limit)

    return TournamentParticipantsPublic(data=participants, count=count)


@router.get(
    '/{participant_id}',
    # dependencies=[Depends(get_current_user)],
    response_model=TournamentParticipantPublic,
)
async def read_tournament_participant(
    session: SessionDep,
    participant_id: int,
) -> Any:
    """
    Retrieve tournament participant by id.
    """
    participant = await get_tournament_participant_by_id(session, participant_id)

    if not participant:
        raise HTTPException(
            status_code=404, detail="Tournament participant not found")

    return participant

async def get_tournament_participant_by_id(session, participant_id):
    statement = select(TournamentParticipant).where(
        TournamentParticipant.id == participant_id)
    participant = (await session.execute(statement)).scalar_one_or_none()
    return participant


@router.post(
    "/",
    dependencies=[Depends(get_current_subscriber)],
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
    tournament = await session.get(Tournament, participant_in.tournament_id)
    await validate_users_age_in_category(participant_in, session, tournament)
    # participants_ids_statement = (
    #     select(TournamentParticipant.user_id, TournamentParticipant.partner_id)
    #     .select_from(TournamentParticipant)
    #     .where(TournamentParticipant.tournament_id == participant_in.tournament_id)
    # )
    
    # participants_ids_raw = (await session.execute(participants_ids_statement)).all()
    # participants_ids = [item for sublist in participants_ids_raw for item in sublist if item]

    # if current_user.id in participants_ids:
    #     raise HTTPException(
    #         status_code=400, detail="User is already a participant of this tournament")
    
    user = await session.get(User, participant_in.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if participant_in.partner_id:
        partner = await session.get(User, participant_in.partner_id)
        if not partner:
            raise HTTPException(status_code=404, detail="Partner not found")
    participant = await participant_crud.create_tournament_participant(session, participant_in)
    return participant

async def validate_users_age_in_category(participant_in, session, tournament):
    category = await session.get(Category, tournament.category_id)
    user = await session.get(User, participant_in.user_id)
    partner = await session.get(User, participant_in.partner_id) if participant_in.partner_id else None
    is_user_age_in_category = category.from_age <= user.age <= category.to_age
    is_partner_age_in_category = category.from_age <= partner.age <= category.to_age if partner else True
    if not is_user_age_in_category or not is_partner_age_in_category:
        raise HTTPException(
            status_code=400,
            detail="Users do not meet the age requirements for this category",
        )


@router.put(
    '/{participant_id}',
    dependencies=[Depends(get_current_subscriber)],
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

    participant = await participant_crud.update_tournament_participant(
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
