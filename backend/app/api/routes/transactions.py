from datetime import timedelta
from typing import Annotated, Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse

from backend.app.api.deps import CurrentUser, SessionDep, get_current_user
from backend.app.core import security
import backend.app.crud as crud
from backend.app.payment import Payment
from common.db.models import Transaction, TransactionCreate, TransactionPublic


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
    
    transaction = await crud.create_transaction(session, transaction_in)
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
    if transaction.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions (transaction.user_id != current_user.id)")
    
    payment = Payment()
    status = await payment.get_payment_status(transaction.operation_id)
    
    transaction.status = status
    
    session.add(transaction)
    await session.commit()
    await session.refresh(transaction)
    
    return transaction