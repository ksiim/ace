from typing import Any
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.security import get_password_hash, verify_password
from common.db.models import Comment, CommentCreate, News, NewsCreate, TournamentParticipant, TournamentParticipantCreate, TournamentParticipantPublic, Trainer, TrainerCreate, TrainerPublic, User, UserCreate

from backend.app.utils import logger


async def create_user(*, session: AsyncSession, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": await get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def create_trainer(*, session: AsyncSession, trainer_create: TrainerCreate) -> Trainer:
    db_obj = Trainer.model_validate(trainer_create)
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = (await session.execute(statement)).scalar_one_or_none()
    return session_user


async def authenticate(session: AsyncSession, email: str, password: str) -> User | None:
    db_user = await get_user_by_email(session=session, email=email)

    if not db_user:
        return None
    if not await verify_password(password, db_user.hashed_password):
        return None
    return db_user


async def get_user_by_telegram_id(session: AsyncSession, user_telegram_id: int) -> User | None:
    statement = select(User).where(User.telegram_id == user_telegram_id)
    session_user = (await session.execute(statement)).scalars().all()[-1]
    return session_user


async def update_user(session: AsyncSession, user_in: User, db_user: User) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {
        "updated_at": user_in.updated_at.replace(tzinfo=None) if user_in.updated_at else None,
        "created_at": user_in.created_at.replace(tzinfo=None) if user_in.created_at else None,
        "end_of_subscription": user_in.end_of_subscription.replace(tzinfo=None) if user_in.end_of_subscription else None,
    }

    if "password" in user_data:
        password = user_data["password"]
        hashed_password = await get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user


async def update_trainer(*, session: AsyncSession, db_trainer: Trainer, trainer_in: TrainerCreate) -> TrainerPublic:
    trainer_data = trainer_in.model_dump(exclude_unset=True)
    db_trainer.sqlmodel_update(trainer_data)
    session.add(db_trainer)
    await session.commit()
    await session.refresh(db_trainer)
    return db_trainer


async def create_news(*, session: AsyncSession, news_create: NewsCreate) -> News:
    db_obj = News.model_validate(
        news_create,
        update={
            "created_at": news_create.created_at.replace(tzinfo=None)
        }
    )
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def update_news(*, session: AsyncSession, news: News, news_update: News) -> News:
    news_data = news_update.model_dump(exclude_unset=True)
    extra_data = {
        "created_at": news_update.created_at.replace(tzinfo=None) if news_update.created_at else None,
    }
    news.sqlmodel_update(news_data, update=extra_data)
    session.add(news)
    await session.commit()
    await session.refresh(news)
    return news


async def create_comment(*, session: AsyncSession, comment_create: CommentCreate) -> Comment:
    db_obj = Comment.model_validate(
        comment_create,
        update={
            "created_at": comment_create.created_at.replace(
                tzinfo=None
            )
        }
    )
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def update_comment(*, session: AsyncSession, db_comment: Comment, comment_update: Comment) -> Comment:
    comment_data = comment_update.model_dump(exclude_unset=True)
    extra_data = {
        "created_at": comment_update.created_at.replace(tzinfo=None) if comment_update.created_at else None,
    }
    db_comment.sqlmodel_update(comment_data, update=extra_data)
    session.add(db_comment)
    await session.commit()
    await session.refresh(db_comment)
    return db_comment


async def create_tournament_participant(session: AsyncSession, tournament_participant_in: TournamentParticipantCreate) -> TournamentParticipantPublic:
    db_obj = TournamentParticipant.model_validate(tournament_participant_in)
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def update_tournament_participant(*, session: AsyncSession, db_tournament_participant: TournamentParticipant, tournament_participant_in: TournamentParticipant) -> TournamentParticipantPublic:
    tournament_participant_data = tournament_participant_in.model_dump(
        exclude_unset=True
    )
    db_tournament_participant.sqlmodel_update(tournament_participant_data)
    print(db_tournament_participant)
    session.add(db_tournament_participant)
    await session.commit()
    await session.refresh(db_tournament_participant)
    return db_tournament_participant
