import uuid
from typing import Any, Optional
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlmodel import col, delete, func, select

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
        telegram_id=1234567895,
    )
    session.add(user)
    await session.commit()
    return 'Super user created'

@router.get(
    "/{user_telegram_id}",
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