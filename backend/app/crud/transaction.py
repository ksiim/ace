from typing import Any
from sqlalchemy import select
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

async def get_by_operation_id(session: AsyncSession, operation_id: str) -> Any:
    statement = select(Transaction).where(Transaction.operation_id == operation_id)
    transaction_result = (await session.execute(statement)).scalar_one_or_none()

    return transaction_result