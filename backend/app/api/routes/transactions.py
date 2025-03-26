import base64
from datetime import timedelta
import datetime
from typing import Annotated, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

from backend.app.api.deps import CurrentUser, SessionDep, get_current_user
from backend.app.core.config import settings
from backend.app.crud import transaction as transaction_crud
from backend.app.payment import Payment
from common.db.models import Transaction, TransactionCreate, TransactionPublic
from common.db.models.transaction import WebhookPayload
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

@router.post(
    '/create_webhooks',
)
async def create_webhooks():
    """
    Create webhooks
    """
    webhook_list = ["incomingPayment", "acquiringInternetPayment"]
    payment = Payment()
    response = await payment.create_webhooks(webhook_list)
    print(response)
    return


async def get_and_validate_transaction(
    session: SessionDep,
    transaction_id: int
) -> Transaction:
    """Получить и проверить транзакцию."""
    transaction = await session.get(Transaction, transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
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
    
def get_pem_from_jwk(jwk: dict) -> str:
    """Преобразование JWK в PEM."""
    e = int.from_bytes(base64.urlsafe_b64decode(jwk["e"] + "=="), "big")
    n = int.from_bytes(base64.urlsafe_b64decode(jwk["n"] + "=="), "big")
    public_key = rsa.RSAPublicNumbers(e, n).public_key()
    pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    return pem.decode("utf-8")
    
def decode_webhook(token: str) -> WebhookPayload:
    """Декодируем JWT и возвращаем данные вебхука в виде WebhookPayload."""
    try:
        jwt_key = get_pem_from_jwk(settings.PUBLIC_KEY)
        decoded = jwt.decode(token, jwt_key, algorithms=["RS256"])
        if decoded.get("webhookType") != "acquiringInternetPayment":
            raise ValueError("Invalid webhook type")
        
        # Преобразуем сумму в float напрямую при декодировании
        decoded["amount"] = float(decoded["amount"])
        
        # Создаем экземпляр WebhookPayload из декодированных данных
        return WebhookPayload(**decoded)
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=400, detail=f"Invalid webhook token: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def handle_webhook(
    request: Request,
    session: SessionDep
) -> JSONResponse:
    payload = await request.body()  # Получаем байты
    token = payload.decode("utf-8")
    """
    Обработка вебхука acquiringInternetPayment от Точки Банка.
    """
    payload: WebhookPayload = decode_webhook(token)
    
    print(token)
    
    transaction = await transaction_crud.get_by_operation_id(session, payload.operation_id)
    if not transaction:
        raise HTTPException(status_code=404, detail=f"Transaction not found for operationId: {payload.operation_id}")
    
    if transaction.amount != payload.amount:
        raise HTTPException(status_code=400, detail="Amount mismatch between transaction and webhook")
    
    payment = Payment()
    outer_transation_status = await payment.get_payment_status(transaction.operation_id)
    
    transaction.status = outer_transation_status
    transaction.updated_at = datetime.datetime.now()
    
    # Исполняем транзакцию, если она еще не завершена
    await execute_transaction(session, transaction.id)
    
    await session.commit()
    await session.refresh(transaction)
    
    return JSONResponse(content={"status": "ok"}, status_code=200)


async def confirm_transaction(
    session: SessionDep,
    transaction: Transaction
) -> Transaction:
    """Подтвердить транзакцию."""
    transaction.completed = True
    transaction.status = "COMPLETED"
    transaction.updated_at = datetime.datetime.now()
    
    session.add(transaction)
    return transaction


@router.post(
    "/{transaction_id}/execute",
    dependencies=[Depends(get_current_user)],
    response_model=TransactionPublic,
)
async def execute_transaction(
    session: SessionDep,
    transaction_id: int,
) -> TransactionPublic:
    """
    Execute an approved transaction, adding months to user's subscription.
    """
    transaction = await get_and_validate_transaction(session, transaction_id)
    
    await update_user_subscription(session, transaction.user_id, transaction.months)
    
    await confirm_transaction(session, transaction)
    
    await session.commit()
    await session.refresh(transaction)
    
    return transaction
