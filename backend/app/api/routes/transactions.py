from datetime import timedelta
import datetime
from typing import Annotated, Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse

from backend.app.api.deps import CurrentUser, SessionDep, get_current_user
from backend.app.core import security
from backend.app.crud import transaction as transaction_crud
from backend.app.payment import Payment
from common.db.models import Transaction, TransactionCreate, TransactionPublic
from common.db.models.user import User


router = APIRouter()


@router.post(
    "/",
    dependencies=[Depends(get_current_user)],
    response_model=TransactionPublic,
)
async def create_transaction(
    session: SessionDep,
    current_user: CurrentUser,
    amount: int,
    months: int,
) -> TransactionPublic:
    """
    Create transaction
    """
    
    payment = Payment()
    link, operation_id = await payment.get_payment_link_and_operation_id(amount)
    
    transaction_in = TransactionCreate(
        amount=amount,
        months=months,
        user_id=current_user.id,
        payment_link=link,
        operation_id=operation_id,
        status="CREATED",
    )
    
    transaction = await transaction_crud.create_transaction(session, transaction_in)
    return transaction

@router.get(
    "/{transaction_id}",
    dependencies=[Depends(get_current_user)],
    response_model=TransactionPublic,
)
async def read_transaction(
    session: SessionDep,
    current_user: CurrentUser,
    transaction_id: int,
) -> TransactionPublic:
    """
    Get transaction by ID
    """
    transaction = await session.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if transaction.user_id != current_user.id and not current_user.admin:
        raise HTTPException(status_code=403, detail="Not enough permissions (transaction.user_id != current_user.id)")
    
    payment = Payment()
    status = await payment.get_payment_status(transaction.operation_id)
    
    transaction.status = status
    
    session.add(transaction)
    await session.commit()
    await session.refresh(transaction)
    
    return transaction


async def get_and_validate_transaction(
    session: SessionDep,
    current_user: CurrentUser,
    transaction_id: int
) -> Transaction:
    """Получить и проверить транзакцию."""
    transaction = await session.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if transaction.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    if transaction.status != "APPROVED":
        raise HTTPException(status_code=400, detail="Transaction is not approved")
    if transaction.completed:
        raise HTTPException(status_code=400, detail="Transaction already executed")
    return transaction

async def update_user_subscription(
    session: SessionDep,
    user_id: int,
    months: int
) -> User:
    """Обновить подписку пользователя."""
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.end_of_subscription:
        user.end_of_subscription += timedelta(days=30 * months)
    else:
        user.end_of_subscription = datetime.datetime.now() + timedelta(days=30 * months)
    
    session.add(user)
    return user

async def confirm_transaction(
    session: SessionDep,
    transaction: Transaction
) -> None:
    """Подтвердить транзакцию."""
    transaction.completed = True
    transaction.updated_at = datetime.datetime.now()
    session.add(transaction)


@router.post(
    "/{transaction_id}/execute",
    dependencies=[Depends(get_current_user)],
    response_model=TransactionPublic,
)
async def execute_transaction(
    session: SessionDep,
    current_user: CurrentUser,
    transaction_id: int,
) -> TransactionPublic:
    """
    Execute an approved transaction, adding months to user's subscription.
    """
    transaction = await get_and_validate_transaction(session, current_user, transaction_id)
    
    await update_user_subscription(session, transaction.user_id, transaction.months)
    
    await confirm_transaction(session, transaction)
    
    await session.commit()
    await session.refresh(transaction)
    
    return transaction
