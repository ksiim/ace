from typing import List
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from common.db.models.news import News, NewsCreate
from common.db.models.news_photo import NewsPhoto


async def create_news(*, session: AsyncSession, news_create: NewsCreate) -> News:
    photo_paths = news_create.photo_paths
        
    db_obj = News.model_validate(
        news_create,
        update={
            "created_at": news_create.created_at.replace(tzinfo=None)
        }
    )
        
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    
    await attach_photos_to_news(
        session=session,
        photo_paths=photo_paths,
        news=db_obj
    )
        
    await session.commit()
    await session.refresh(db_obj)
        
    return db_obj

async def attach_photos_to_news(session: AsyncSession, photo_paths: List[str], news: News):
    for i, photo_path in enumerate(photo_paths):
        if not photo_path:
            raise ValueError("Photo path is empty")
        photo = NewsPhoto(
            photo_path=photo_path,
            order_num=i,
            news_id=news.id
        )
        session.add(photo)


async def update_news(*, session: AsyncSession, news: News, news_update: News) -> News:
    photo_paths = news_update.photo_paths
    if photo_paths:
        await session.execute(delete(NewsPhoto).where(NewsPhoto.news_id == news.id))
        await attach_photos_to_news(
            session=session,
            photo_paths=photo_paths,
            news=news
        )
        
        await session.commit()
    news_data = news_update.model_dump(exclude_unset=True)
    extra_data = {
        "created_at": news_update.created_at.replace(tzinfo=None) if news_update.created_at else None,
    }
    news.sqlmodel_update(news_data, update=extra_data)
    session.add(news)
    await session.commit()
    await session.refresh(news)
    return news
