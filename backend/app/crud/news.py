from sqlalchemy.ext.asyncio import AsyncSession

from common.db.models.news import News, NewsCreate


async def create_news(*, session: AsyncSession, news_create: NewsCreate) -> News:
    db_obj = News.model_validate(
        news_create,
        update={
            "created_at": news_create.created_at.replace(tzinfo=None)
        }
    )
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj


async def update_news(*, session: AsyncSession, news: News, news_update: News) -> News:
    news_data = news_update.model_dump(exclude_unset=True)
    extra_data = {
        "created_at": news_update.created_at.replace(tzinfo=None) if news_update.created_at else None,
    }
    news.sqlmodel_update(news_data, update=extra_data)
    session.add(news)
    await session.commit()
    await session.refresh(news)
    return news
