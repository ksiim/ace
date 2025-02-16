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
from common.db.models import Message, Sex, SexCreate, SexPublic, SexUpdate, SexesPublic


router = APIRouter()


@router.get(
    "/",
    dependencies=[Depends(get_current_user)],
    response_model=SexesPublic,
)
async def read_sexes(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve sexes.
    """
    count_statement = select(func.count()).select_from(Sex)
    count = (await session.execute(count_statement)).scalar_one_or_none()
    
    statement = select(Sex).offset(skip).limit(limit)
    sexes = (await session.execute(statement)).scalars().all()
    
    return SexesPublic(data=sexes, count=count)

@router.get(
    '/{sex_id}',
    dependencies=[Depends(get_current_user)],
    response_model=SexPublic,
)
async def read_sex(
    session: SessionDep,
    sex_id: int,
) -> Any:
    """
    Retrieve sex by id.
    """
    statement = select(Sex).where(Sex.id == sex_id)
    sex = (await session.execute(statement)).scalar_one_or_none()
    
    if not sex:
        raise HTTPException(status_code=404, detail="Sex not found")
    
    return sex

@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=SexPublic,
)
async def create_sex(
    session: SessionDep,
    sex_in: SexCreate
) -> Any:
    """
    Create sex.
    """
    sex = Sex.model_validate(sex_in)
    session.add(sex)
    await session.commit()
    await session.refresh(sex)
    return sex

@router.put(
    '/{sex_id}',
    dependencies=[Depends(get_current_active_superuser)],
    response_model=SexPublic,
)
async def update_sex(
    session: SessionDep,
    sex_id: int,
    sex_in: SexUpdate
):
    """
    Update sex.
    """
    sex = await session.get(Sex, sex_id)
    if not sex:
        raise HTTPException(status_code=404, detail="Sex not found")
    update_dict = sex_in.model_dump(exclude_unset=True)
    sex.sqlmodel_update(update_dict)
    session.add(sex)
    await session.commit()
    await session.refresh(sex)
    return sex

@router.delete(
    '/{sex_id}',
    dependencies=[Depends(get_current_active_superuser)],
    response_model=Message
)
async def delete_sex(
    session: SessionDep,
    sex_id: int,
    current_user: CurrentUser
) -> Any:
    sex = await session.get(Sex, sex_id)
    if not sex:
        raise HTTPException(status_code=404, detail="Sex not found")
    if not current_user.admin:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    await session.delete(sex)
    await session.commit()
    return Message(message="Sex deleted successfully")