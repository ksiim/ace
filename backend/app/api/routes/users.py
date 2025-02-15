import uuid
from typing import Any, Optional
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, update
from sqlmodel import col, delete, func, select

from backend.app import crud
from backend.app.api.deps import (
    SessionDep,
    get_current_active_superuser,
)
from backend.app.core.config import SUPERUSER_EMAIL, SUPERUSER_PASSWORD
from backend.app.core.security import get_password_hash
from common.db.models import User, UserPublic, UsersPublic


router = APIRouter()


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
async def read_users(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve users.
    """
    count_statement = select(func.count()).select_from(User)
    count = (await session.execute(count_statement)).scalar_one_or_none()

    statement = select(User).offset(skip).limit(limit)
    users = (await session.execute(statement)).scalars().all()

    return UsersPublic(data=users, count=count)

@router.get(
    "/create_super_user",
)
async def create_super_user(
    session: SessionDep,
) -> Any:
    """
    Create a super user
    """
    user = User(
        email=SUPERUSER_EMAIL,
        hashed_password=await get_password_hash(SUPERUSER_PASSWORD),
        admin=True,
        telegram_id=123456789,
    )
    session.add(user)
    await session.commit()
    return 'Super user created'

@router.get(
    "/{user_telegram_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UserPublic,
)
async def read_user_by_telegram_id(
    session: SessionDep,
    user_telegram_id: int,
) -> Any:
    """
    Retrieve user by telegram_id.
    """
    statement = select(User).where(User.telegram_id == user_telegram_id)
    user = (await session.execute(statement)).scalars().first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.delete(
    "/{user_telegram_id}",
    dependencies=[Depends(get_current_active_superuser)],
)
async def delete_user_by_telegram_id(
    session: SessionDep,
    user_telegram_id: int,
) -> Any:
    """
    Delete user by telegram_id.
    """
    user_found = (await session.execute(select(User).where(User.telegram_id == user_telegram_id))).scalar_one_or_none()
    if user_found is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    statement = delete(User).where(User.telegram_id == user_telegram_id)
    await session.execute(statement)
    await session.commit()
    return {"message": "User deleted successfully"}


@router.put(
    "/{user_telegram_id}",
    dependencies=[Depends(get_current_active_superuser)],
)
async def update_user_by_telegram_id(
    session: SessionDep,
    user_telegram_id: int,
    user_in: UserPublic,
) -> Any:
    """
    Update user by telegram_id.
    """
    db_user = (await session.execute(select(User).where(User.telegram_id == user_telegram_id))).scalar_one_or_none()
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = await crud.update_user(session=session, db_user=db_user, user_in=user_in)
    return user
