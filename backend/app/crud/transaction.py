from typing import Any
from sqlalchemy.ext.asyncio import AsyncSession

from common.db.models.transaction import (
    Transaction, TransactionCreate,
    TransactionPublic
)

async def create_transaction(session: AsyncSession, transaction_in: TransactionCreate) -> TransactionPublic:
    db_obj = Transaction.model_validate(
        transaction_in,
        update={
            "created_at": transaction_in.created_at.replace(tzinfo=None),
            "updated_at": transaction_in.updated_at.replace(tzinfo=None)
        }
    )
    session.add(db_obj)
    await session.commit()
    await session.refresh(db_obj)
    return db_obj