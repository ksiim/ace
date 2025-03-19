import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from common.db.models.tournament import Tournament, TournamentCreate, TournamentUpdate
import logging

from common.db.models.user import User

logger = logging.getLogger(__name__)


async def create_tournament(session: AsyncSession, tournament_in: TournamentCreate) -> Tournament:
    tournament = Tournament.model_validate(
        tournament_in,
        update={
            "owner_id": tournament_in.owner_id,
            "region_id": tournament_in.region_id,
            "category_id": tournament_in.category_id,
            "sex_id": tournament_in.sex_id,
            "date": tournament_in.date,
        },
    )
    session.add(tournament)
    await session.commit()
    await session.refresh(tournament)
    
    return tournament


async def update_tournament(session: AsyncSession, tournament_id: int, tournament_in: TournamentUpdate) -> Tournament:
    tournament = await session.get(Tournament, tournament_id)
    update_dict = tournament_in.model_dump(exclude_unset=True)
    update_dict["date"] = update_dict["date"]
    tournament.sqlmodel_update(update_dict)
    session.add(tournament)
    await session.commit()
    await session.refresh(tournament)
    return tournament
