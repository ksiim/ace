from typing import List
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from common.db.models.group import GroupStage, GroupStageCreate, GroupStageUpdate


async def get_groups_by_tournament(
    tournament_id: int,
    session: AsyncSession,
) -> List[GroupStage]:
    query = select(
        GroupStage
    ).where(GroupStage.tournament_id == tournament_id)
    result = await session.execute(query)
    return result.scalars().all()


async def delete_groups_by_tournament(
    tournament_id: int,
    session: AsyncSession,
):
    query = select(
        GroupStage
    ).where(GroupStage.tournament_id == tournament_id)
    result = await session.execute(query)
    groups = result.scalars().all()
    for group in groups:
        await session.delete(group)
    await session.commit()


async def create_group(
    data: GroupStageCreate,
    session: AsyncSession,
    tournament_id: int,
) -> GroupStage:
    group = GroupStage(
        **data.model_dump(),
        tournament_id=tournament_id,
    )
    session.add(group)
    await session.commit()
    await session.refresh(group)
    created_group: GroupStage | None = await session.get(GroupStage, group.id)
    return GroupStage(**created_group.model_dump()) if created_group else None


async def get_group_by_id(
    group_id: int,
    session: AsyncSession,
) -> GroupStage | None:
    group: GroupStage | None = await session.get(GroupStage, group_id)
    return group 


async def update_group(
    group: GroupStage,
    data: GroupStageUpdate,
    session: AsyncSession,
) -> GroupStage:
    for field, value in data.model_dump(
        exclude_unset=True
    ).items():
        setattr(group, field, value)
    session.add(group)
    await session.commit()
    await session.refresh(group)
    return group


async def delete_group(group: GroupStage, session: AsyncSession):
    await session.delete(group)
    await session.commit()
