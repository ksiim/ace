from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os

DB_NAME = 'tg_bot.db'
DB_DIR = os.path.join(os.getcwd(), DB_NAME)

engine = create_async_engine(f'sqlite+aiosqlite:///{DB_DIR}')
Session = async_sessionmaker(engine)

Base = declarative_base()

async def create_database():
    if not os.path.exists(DB_NAME):
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
