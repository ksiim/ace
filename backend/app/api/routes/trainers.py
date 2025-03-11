from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, update
from sqlmodel import col, delete, func, select

from backend.app.crud import trainer as trainer_crud
from backend.app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_admin,
    get_current_user,
)
from common.db.models import Message, Trainer, TrainerCreate, TrainerPublic, TrainerUpdate, TrainersPublic


router = APIRouter()


@router.get(
    "/",
    # dependencies=[Depends(get_current_user)],
    response_model=TrainersPublic,
)
async def read_trainers(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve trainers
    """
    count_statement = select(func.count()).select_from(Trainer)
    count = (await session.execute(count_statement)).scalar_one_or_none()

    statement = select(Trainer).offset(skip).limit(limit)
    trainers = (await session.execute(statement)).scalars().all()

    return TrainersPublic(data=trainers, count=count)


@router.get(
    "/{trainer_id}",
    # dependencies=[Depends(get_current_user)],
    response_model=TrainerPublic,
)
async def read_trainer(
    session: SessionDep,
    trainer_id: int,
) -> Any:
    """
    Retrieve trainer
    """
    trainer = await session.get(Trainer, trainer_id)
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    return trainer


@router.post(
    "/",
    response_model=TrainerPublic,
    dependencies=[Depends(get_current_admin)]
)
async def create_trainer(
    session: SessionDep,
    trainer_in: TrainerCreate,
) -> Any:
    """
    Create new trainer
    """
    trainer = await trainer_crud.create_trainer(session=session, trainer_create=trainer_in)
    return trainer


@router.put(
    "/{trainer_id}",
    response_model=TrainerPublic,
    dependencies=[Depends(get_current_admin)]
)
async def update_trainer(
    session: SessionDep,
    trainer_id: int,
    trainer_in: TrainerUpdate,
) -> Any:
    """
    Update a trainer
    """
    db_trainer = await session.get(Trainer, trainer_id)
    if not db_trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    db_trainer = await trainer_crud.update_trainer(session=session, db_trainer=db_trainer, trainer_in=trainer_in)
    return db_trainer


@router.delete(
    "/{trainer_id}",
    response_model=Message,
    dependencies=[Depends(get_current_admin)]
)
async def delete_trainer(
    session: SessionDep,
    trainer_id: int,
) -> Any:
    """
    Delete a trainer
    """
    db_trainer = await session.get(Trainer, trainer_id)
    if not db_trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    await session.delete(db_trainer)
    await session.commit()
    return Message(
        message="Trainer deleted successfully"
    )
