from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from common.db.models.group import (
    GroupMatch,
    GroupMatchCreate,
    GroupMatchUpdate
)


async def create_match(
    data: GroupMatchCreate,
    session: AsyncSession,
) -> GroupMatch:
    match = GroupMatch(**data.model_dump())
    session.add(match)
    await session.commit()
    await session.refresh(match)
    return match


async def update_match(
    match: GroupMatch,
    match_in: GroupMatchUpdate,
    session: AsyncSession = None,
) -> GroupMatch:
    match_data = match.model_dump()
    update_data = match_in.model_dump(exclude_unset=True)
    for field in match_data:
        if field in update_data:
            setattr(match, field, update_data[field])
    session.add(match)
    await session.commit()
    await session.refresh(match)
    return match


async def get_matches_by_group(
    group_id: int,
    session: AsyncSession,
) -> List[GroupMatch]:
    query = select(
        GroupMatch
    ).where(GroupMatch.group_id == group_id)
    result = await session.execute(query)
    return result.scalars().all()


async def delete_match(
    match: GroupMatch,
    session: AsyncSession,
):
    await session.delete(match)
    await session.commit()
