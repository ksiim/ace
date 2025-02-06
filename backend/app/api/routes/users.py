import uuid
from typing import Any, Optional
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlmodel import col, delete, func, select

from backend.app.api.deps import (
    SessionDep,
)
# from app.core.security import get_password_hash, verify_password
from common.db.models import User


router = APIRouter()


@router.get(
    "/",
)
async def read_users(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve users.
    """
    query = select(User)
    users = await session.execute(query)
    return users.scalars().all()