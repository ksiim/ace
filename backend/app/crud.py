from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.security import verify_password
from common.db.models import User

from backend.app.utils import logger


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = (await session.execute(statement)).scalars().all()[-1]
    return session_user
    
async def authenticate(session: AsyncSession, email: str, password: str) -> User | None:
    db_user = await get_user_by_email(session=session, email=email)

    if not db_user:
        return None
    if not await verify_password(password, db_user.hashed_password):
        return None
    return db_user