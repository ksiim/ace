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
from common.db.models import Category, Message, Region, Sex, Tournament, TournamentCreate, TournamentPublic, TournamentUpdate, TournamentsPublic


router = APIRouter()


@router.get(
    "/",
    dependencies=[Depends(get_current_user)],
    response_model=TournamentsPublic,
)
async def read_user_tournaments(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve tournaments. If user is not an admin, only return tournaments owned by the user.
    """
    if current_user.admin:
        count_statement = select(func.count()).select_from(Tournament)
        count = (await session.execute(count_statement)).scalar_one_or_none()

        statement = select(Tournament).offset(skip).limit(limit)
        tournaments = (await session.execute(statement)).scalars().all()
    else:
        count_statement = select(func.count()).where(Tournament.owner_id == current_user.id)
        count = (await session.execute(count_statement)).scalar_one_or_none()
        
        statement = select(Tournament).where(Tournament.owner_id == current_user.id).offset(skip).limit(limit)
        tournaments = (await session.execute(statement)).scalars().all()
        
    return TournamentsPublic(data=tournaments, count=count)


@router.get(
    "/all",
    dependencies=[Depends(get_current_user)],
    response_model=TournamentsPublic,
)
async def read_all_tournaments(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve all tournaments
    """
    count_statement = select(func.count()).select_from(Tournament)
    count = (await session.execute(count_statement)).scalar_one_or_none()

    statement = select(Tournament).offset(skip).limit(limit)
    tournaments = (await session.execute(statement)).scalars().all()
    return TournamentsPublic(data=tournaments, count=count)


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
)
async def create_tournament(
    session: SessionDep,
    tournament_in: TournamentCreate,
) -> Any:
    """
    Create a new tournament
    """
    await validate_tournament_inputs(session, tournament_in)
    
    tournament = Tournament.model_validate(
        tournament_in,
        update={
            "owner_id": tournament_in.owner_id,
            "region_id": tournament_in.region_id,
            "category_id": tournament_in.category_id,
            "sex_id": tournament_in.sex_id,
            "date": tournament_in.date.replace(tzinfo=None),
        },
    )
    session.add(tournament)
    await session.commit()
    await session.refresh(tournament)
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
    dependencies=[Depends(get_current_user)],
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

@router.put(
    '/{tournament_id}',
    dependencies=[Depends(get_current_active_superuser)],
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
        raise HTTPException(status_code=403, detail="User not authorized to update this tournament")
    
    tournament = await session.get(Tournament, tournament_id)
    update_dict = tournament_in.model_dump(exclude_unset=True)
    update_dict["date"] = update_dict["date"].replace(tzinfo=None)
    tournament.sqlmodel_update(update_dict)
    session.add(tournament)
    await session.commit()
    await session.refresh(tournament)
    return tournament

@router.delete(
    '/{tournament_id}',
    dependencies=[Depends(get_current_active_superuser)],
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