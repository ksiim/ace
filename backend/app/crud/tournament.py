import datetime
from sqlalchemy import select
from sqlalchemy.orm import aliased
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.messaging.producer import send_tournament_notification_task
from common.db.models.participant import TournamentParticipant
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
            "date": tournament_in.date.replace(tzinfo=None),
        },
    )
    session.add(tournament)
    await session.commit()
    await session.refresh(tournament)
    
    notification_date = tournament.date - datetime.timedelta(days=4)
    
    await send_tournament_notification_task(
        tournament_id=tournament.id,
        notification_date=notification_date.isoformat()
    )
    
    return tournament


async def update_tournament(session: AsyncSession, tournament_id: int, tournament_in: TournamentUpdate) -> Tournament:
    tournament = await session.get(Tournament, tournament_id)
    update_dict = tournament_in.model_dump(exclude_unset=True)
    update_dict["date"] = update_dict["date"].replace(tzinfo=None)
    tournament.sqlmodel_update(update_dict)
    session.add(tournament)
    await session.commit()
    await session.refresh(tournament)
    return tournament


async def close_registration_and_get_participants(tournament_id: int, session: AsyncSession) -> list[dict]:
    """Закрываем регистрацию и возвращаем список участников."""
    tournament = await session.get(Tournament, tournament_id)
    if not tournament:
        logger.error(f"Tournament {tournament_id} not found")
        return []
    
    tournament.can_register = False
    session.add(tournament)
    
    UserAlias = aliased(User, name="user")
    PartnerAlias = aliased(User, name="partner")
    
    statement = (
        select(
            UserAlias.telegram_id.label("user_telegram_id"),
            PartnerAlias.telegram_id.label("partner_telegram_id"),
        )
        .select_from(TournamentParticipant)
        .join(UserAlias, UserAlias.id == TournamentParticipant.user_id)
        .outerjoin(PartnerAlias, PartnerAlias.id == TournamentParticipant.partner_id)
        .where(TournamentParticipant.tournament_id == tournament_id)
        .distinct()
    )
    participants = (await session.execute(statement)).all()
    participants_list = list()
    
    for participant in participants:
        participants_list.append({"user_id": participant[0],})
        if participant[1]:
            participants_list.append({"user_id": participant[1],})
    
    await session.commit()
    return participants_list
