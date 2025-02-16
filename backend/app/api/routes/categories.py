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
from common.db.models import Category, CategoryCreate, CategoryPublic, CategoryUpdate, CategoriesPublic, Message


router = APIRouter()


@router.get(
    "/",
    dependencies=[Depends(get_current_user)],
    response_model=CategoriesPublic,
)
async def read_categories(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve categories.
    """
    count_statement = select(func.count()).select_from(Category)
    count = (await session.execute(count_statement)).scalar_one_or_none()
    
    statement = select(Category).offset(skip).limit(limit)
    categories = (await session.execute(statement)).scalars().all()
    
    return CategoriesPublic(data=categories, count=count)


@router.get(
    '/{category_id}',
    dependencies=[Depends(get_current_user)],
    response_model=CategoryPublic,
)
async def read_category(
    session: SessionDep,
    category_id: int,
) -> Any:
    """
    Retrieve category by id.
    """
    statement = select(Category).where(Category.id == category_id)
    category = (await session.execute(statement)).scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return category


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=CategoryPublic,
)
async def create_category(
    category_in: CategoryCreate,
    session: SessionDep,
) -> Any:
    """
    Create a new category.
    """
    category = Category.model_validate(category_in)
    session.add(category)
    await session.commit()
    await session.refresh(category)
    return category

@router.put(
    '/{category_id}',
    dependencies=[Depends(get_current_active_superuser)],
    response_model=CategoryPublic,
)
async def update_category(
    category_id: int,
    category_in: CategoryUpdate,
    session: SessionDep,
    current_user: CurrentUser,
) -> Any:
    """
    Update a category.
    """
    category = await session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if not current_user.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    update_dict = category_in.model_dump(exclude_unset=True)
    category.sqlmodel_update(update_dict)
    session.add(category)
    await session.commit()
    await session.refresh(category)
    return category

@router.delete(
    '/{category_id}',
    dependencies=[Depends(get_current_active_superuser)],
    response_model=Message,
)
async def delete_category(
    session: SessionDep,
    category_id: int,
    current_user: CurrentUser,
) -> Any:
    """
    Delete a category.
    """
    category = await session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if not current_user.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    await session.delete(category)
    await session.commit()
    return Message(message="Category deleted successfully")