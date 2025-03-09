from sqlalchemy.ext.asyncio import AsyncSession

from common.db.models.trainer import Trainer, TrainerCreate, TrainerPublic

async def create_trainer(*, session: AsyncSession, trainer_create: TrainerCreate) -> Trainer:
    db_obj = Trainer.model_validate(trainer_create)
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj

async def update_trainer(*, session: AsyncSession, db_trainer: Trainer, trainer_in: TrainerCreate) -> TrainerPublic:
    trainer_data = trainer_in.model_dump(exclude_unset=True)
    db_trainer.sqlmodel_update(trainer_data)
    session.add(db_trainer)
    await session.commit()
    await session.refresh(db_trainer)
    return db_trainer