from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, or_, update, select
from sqlalchemy.orm import joinedload
from sqlmodel import col, delete, func

from backend.app.crud import tournament as tournament_crud

from backend.app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_admin,
    get_current_organizer_or_admin,
    get_current_user,
)
from backend.app.messaging.producer import send_tournament_money_request_task
from common.db.models.category import Category
from common.db.models.enums import TournamentType, OrderEnum
from common.db.models.participant import TournamentParticipant, TournamentParticipantsPublic
from common.db.models.region import Region
from common.db.models.sex import Sex
from common.db.models.tournament import Tournament, TournamentCreate, TournamentPublic, TournamentUpdate, TournamentsPublic
from common.db.models.base import Message
from common.db.models.user import User


router = APIRouter()


def build_tournament_query(
    base_statement, region_id: int = None,
    category_id: int = None, type: TournamentType = None,
    current_user: CurrentUser = None,
    sex_id: int = None, actual: bool = False
):
    statement = base_statement
    if current_user is not None and not current_user.admin:
        statement = statement.where(Tournament.owner_id == current_user.id)
    if region_id is not None:
        statement = statement.where(Tournament.region_id == region_id)
    if category_id is not None:
        statement = statement.where(Tournament.category_id == category_id)
    if type is not None:
        statement = statement.where(Tournament.type == type)
    if sex_id is not None:
        statement = statement.where(Tournament.sex_id == sex_id)
    if actual:
        statement = statement.where(Tournament.date >= func.now())
    return statement


@router.get(
    "/",
    dependencies=[Depends(get_current_organizer_or_admin)],
    response_model=TournamentsPublic,
)
async def read_user_tournaments(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    region_id: Optional[int] = None,
    category_id: Optional[int] = None,
    sex_id: Optional[int] = None,
    type: Optional[TournamentType] = None,
    sort_by_id: Optional[OrderEnum] = OrderEnum.ASC,
    actual: Optional[bool] = None,
) -> Any:
    """
    Retrieve tournaments. If user is not an admin, only return tournaments owned by the user.
    Optional filters by region_id, category_id and type can be applied.
    """

    if sort_by_id == OrderEnum.ASC:
        base_statement = select(Tournament).order_by(Tournament.id)
    elif sort_by_id == OrderEnum.DESC:
        base_statement = select(Tournament).order_by(desc(Tournament.id))

    count_statement = build_tournament_query(
        select(func.count()).select_from(Tournament),
        region_id, category_id, type, current_user,
        sex_id, actual
    )
    count = (await session.execute(count_statement)).scalar_one_or_none()

    statement = build_tournament_query(
        base_statement, region_id, category_id, type, current_user,
        sex_id, actual
    ).offset(skip).limit(limit)
    tournaments = (await session.execute(statement)).scalars().all()

    return TournamentsPublic(data=tournaments, count=count)


@router.get(
    "/all",
    # dependencies=[Depends(get_current_user)],
    response_model=TournamentsPublic,
)
async def read_all_tournaments(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    region_id: Optional[int] = None,
    category_id: Optional[int] = None,
    sex_id: Optional[int] = None,
    actual: Optional[bool] = None,
    date_sort: Optional[OrderEnum] = OrderEnum.DESC,
    type: Optional[TournamentType] = None,  # Новый фильтр по типу
) -> Any:
    """
    Retrieve all tournaments with optional filters by region_id, category_id and type
    """
    base_statement = build_tournament_query(
        select(Tournament), region_id,
        category_id, type, None, sex_id,
        actual
    )
    count_statement = build_tournament_query(
        select(func.count()).select_from(Tournament),
        region_id, category_id, type, None, sex_id, actual
    )

    count = (await session.execute(count_statement)).scalar_one_or_none()


    statement = base_statement.offset(skip).limit(limit)
    
    if date_sort == OrderEnum.ASC:
        statement = statement.order_by(Tournament.date)
    elif date_sort == OrderEnum.DESC:
        statement = statement.order_by(desc(Tournament.date))
        
    tournaments = (await session.execute(statement)).scalars().all()

    return TournamentsPublic(data=tournaments, count=count)


@router.post(
    '/{tournament_id}/send-money-request',
    dependencies=[Depends(get_current_organizer_or_admin)],
    response_model=Message
)
async def send_money_request(
    session: SessionDep,
    tournament_id: int,
    current_user: CurrentUser
):
    statement = (
        select(Tournament)
        .where(Tournament.id == tournament_id)
        .options(
            joinedload(Tournament.owner),
            joinedload(Tournament.category),
            joinedload(Tournament.region),
            joinedload(Tournament.sex)
        )
    )
    tournament = (await session.execute(statement)).scalar_one_or_none()

    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    if not tournament.owner_id == current_user.id and not current_user.admin:
        raise HTTPException(status_code=400, detail="Not enough permissions")

    statement = (
        select(TournamentParticipant)
        .where(TournamentParticipant.tournament_id == tournament_id)
        .options(
            joinedload(TournamentParticipant.user)
        )
        .distinct()
    )

    participants = (await session.execute(statement)).scalars().all()

    await session.refresh(tournament)

    await send_tournament_money_request_task(tournament, participants)

    return Message(message="Money request sent successfully")


@router.post(
    "/",
    dependencies=[Depends(get_current_organizer_or_admin)],
)
async def create_tournament(
    session: SessionDep,
    tournament_in: TournamentCreate,
) -> Any:
    """
    Create a new tournament
    """
    await validate_tournament_inputs(session, tournament_in)

    tournament = await tournament_crud.create_tournament(session, tournament_in)
    return tournament


async def validate_tournament_inputs(session, tournament_in):
    if not await session.get(Sex, tournament_in.sex_id):
        raise HTTPException(status_code=400, detail="Invalid sex_id")
    elif not await session.get(Region, tournament_in.region_id):
        raise HTTPException(status_code=400, detail="Invalid region_id")
    elif not await session.get(Category, tournament_in.category_id):
        raise HTTPException(status_code=400, detail="Invalid category_id")


@router.get(
    '/{tournament_id}',
    # dependencies=[Depends(get_current_user)],
    response_model=TournamentPublic,
)
async def read_tournament(
    session: SessionDep,
    tournament_id: int,
) -> Any:
    """
    Retrieve tournament by ID
    """
    statement = select(Tournament).where(Tournament.id == tournament_id)
    tournament = (await session.execute(statement)).scalar_one_or_none()

    if tournament is None:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return tournament


@router.get(
    '/{tournament_id}/participants',
    # dependencies=[Depends(get_current_user)],
    response_model=TournamentParticipantsPublic,
)
async def get_participants_by_tournament_id(
    session: SessionDep,
    tournament_id: int,
    skip: int = 0,
    limit: int = 100
) -> TournamentParticipantsPublic:
    """
    Retrieve tournament participants by tournament id.
    """
    count_statement = select(func.count()).where(
        TournamentParticipant.tournament_id == tournament_id)
    count = (await session.execute(count_statement)).scalar_one_or_none()

    statement = select(TournamentParticipant).where(
        TournamentParticipant.tournament_id == tournament_id).offset(skip).limit(limit)
    participants = (await session.execute(statement)).scalars().all()

    return TournamentParticipantsPublic(data=participants, count=count)


@router.put(
    '/{tournament_id}',
    dependencies=[Depends(get_current_organizer_or_admin)],
    response_model=TournamentPublic,
)
async def update_tournament(
    session: SessionDep,
    current_user: CurrentUser,
    tournament_id: int,
    tournament_in: TournamentUpdate,
) -> Any:
    """
    Update tournament by ID
    """
    await validate_tournament_inputs(session, tournament_in)
    if not current_user.admin and current_user.id != tournament_in.owner_id:
        raise HTTPException(
            status_code=403, detail="User not authorized to update this tournament")

    tournament = await tournament_crud.update_tournament(session, tournament_id, tournament_in)
    return tournament


@router.delete(
    '/{tournament_id}',
    dependencies=[Depends(get_current_organizer_or_admin)],
    response_model=Message
)
async def delete_tournament(
    session: SessionDep,
    tournament_id: int,
    current_user: CurrentUser
) -> Any:
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    if not current_user.admin and (tournament.owner_id != current_user.id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    await session.delete(tournament)
    await session.commit()
    return Message(message="Tournament deleted successfully")
