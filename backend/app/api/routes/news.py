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
from common.db.models import Comment, CommentCreate, CommentUpdate, CommentsPublic, Message, News, NewsCreate, NewsPublic, NewsUpdate, NewsesPublic


router = APIRouter()


@router.get(
    "/",
    dependencies=[Depends(get_current_user)],
    response_model=NewsesPublic,
)
async def read_newses(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve newses
    """
    count_statement = select(func.count()).select_from(News)
    count = (await session.execute(count_statement)).scalar_one_or_none()

    statement = select(News).offset(skip).limit(limit)
    newses = (await session.execute(statement)).scalars().all()

    return NewsesPublic(data=newses, count=count)


@router.get(
    "/{news_id}",
    dependencies=[Depends(get_current_user)],
    response_model=NewsPublic,
)
async def read_news(
    session: SessionDep,
    news_id: int,
) -> Any:
    """
    Retrieve news
    """
    news = await session.get(News, news_id)
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    return news


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=NewsPublic,
)
async def create_news(
    session: SessionDep,
    news_create: NewsCreate,
) -> Any:
    """
    Create new news
    """
    news = await crud.create_news(session=session, news_create=news_create)
    return news


@router.put(
    "/{news_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=NewsPublic,
)
async def update_news(
    session: SessionDep,
    news_id: int,
    news_update: NewsUpdate,
) -> Any:
    """
    Update news
    """
    news = await session.get(News, news_id)
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    news = await crud.update_news(session=session, news=news, news_update=news_update)
    return news


@router.delete(
    "/{news_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=NewsPublic,
)
async def delete_news(
    session: SessionDep,
    news_id: int,
) -> Any:
    """
    Delete news
    """
    news = await session.get(News, news_id)
    if not news:
        raise HTTPException(status_code=404, detail="News not found")
    session.delete(news)
    await session.commit()
    return news


@router.get(
    "/comments/{news_id}",
    response_model=CommentsPublic,
)
async def read_comments_by_news_id(
    session: SessionDep,
    news_id: int,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve comments
    """
    count_statement = select(func.count()).where(Comment.news_id == news_id)
    count = (await session.execute(count_statement)).scalar_one_or_none()

    statement = (
        select(Comment)
        .where(Comment.news_id == news_id)
        .offset(skip)
        .limit(limit)
    )
    comments = (await session.execute(statement)).scalars().all()

    return CommentsPublic(data=comments, count=count)


@router.post(
    "/comments/{news_id}",
    response_model=Comment,
)
async def create_comment(
    session: SessionDep,
    comment_create: CommentCreate,
) -> Any:
    """
    Create new comment
    """
    comment = await crud.create_comment(session=session, comment_create=comment_create)
    return comment


@router.delete(
    "/comments/{comment_id}",
    dependencies=[Depends(get_current_user)],
    response_model=Message,
)
async def delete_comment(
    session: SessionDep,
    current_user: CurrentUser,
    comment_id: int,
) -> Any:
    """
    Delete comment
    """
    comment = await session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.creator_id != current_user.id and not current_user.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    await session.delete(comment)
    await session.commit()
    return Message(message="Comment deleted")


@router.put(
    "/comments/{comment_id}",
    dependencies=[Depends(get_current_user)],
    response_model=Comment,
)
async def update_comment(
    session: SessionDep,
    comment_id: int,
    current_user: CurrentUser,
    comment_update: CommentUpdate,
) -> Any:
    """
    Update comment
    """
    comment = await session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.creator_id != current_user.id and not current_user.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    comment = await crud.update_comment(session=session, db_comment=comment, comment_update=comment_update)
    return comment
