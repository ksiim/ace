from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, update
from sqlmodel import col, delete, func, select

from backend.app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_admin,
    get_current_user,
)
from common.db.models.base import Message
from common.db.models.region import Region, RegionCreate, RegionPublic, RegionsPublic


router = APIRouter()


@router.get(
    "/",
    # dependencies=[Depends(get_current_user)],
    response_model=RegionsPublic,
)
async def read_regions(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve regions.
    """
    count_statement = select(func.count()).select_from(Region)
    count = (await session.execute(count_statement)).scalar_one_or_none()

    statement = select(Region).offset(skip).limit(limit)
    regions = (await session.execute(statement)).scalars().all()

    return RegionsPublic(data=regions, count=count)


@router.get(
    '/{region_id}',
    # dependencies=[Depends(get_current_user)],
    response_model=RegionPublic,
)
async def read_region(
    session: SessionDep,
    region_id: int,
) -> Any:
    """
    Retrieve region by id.
    """
    statement = select(Region).where(Region.id == region_id)
    region = (await session.execute(statement)).scalar_one_or_none()

    if not region:
        raise HTTPException(status_code=404, detail="Region not found")

    return region


@router.post(
    "/",
    dependencies=[Depends(get_current_admin)],
    response_model=RegionPublic,
)
async def create_region(
    region_in: RegionCreate,
    session: SessionDep,
) -> Any:
    """
    Create a new region.
    """
    region = Region.model_validate(region_in)
    session.add(region)
    await session.commit()
    await session.refresh(region)
    return region


@router.delete(
    '/{region_id}',
    dependencies=[Depends(get_current_admin)],
    response_model=Message
)
async def delete_tournament(
    session: SessionDep,
    region_id: int,
    current_user: CurrentUser
) -> Any:
    region = await session.get(Region, region_id)
    if not region:
        raise HTTPException(status_code=404, detail="Region not found")
    if not current_user.admin:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    await session.delete(region)
    await session.commit()
    return Message(message="Region deleted successfully")
