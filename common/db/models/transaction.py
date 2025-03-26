import datetime
from typing import TYPE_CHECKING, Optional
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .user import User


class TransactionBase(SQLModel):
    amount: int
    payment_link: str
    operation_id: str
    months: int
    status: str
    completed: bool = Field(default=False, nullable=True)
    
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.now
    )
    updated_at: datetime.datetime = Field(
        default_factory=datetime.datetime.now
    )
    

class Transaction(TransactionBase, table=True):
    __tablename__ = "transactions"
    
    
    id: Optional[int] = Field(primary_key=True, default=None)
    
    user_id: int = Field(foreign_key="users.id", ondelete="CASCADE")
    
    user: "User" = Relationship(back_populates="transactions")
    

class TransactionCreate(TransactionBase):
    user_id: int
    
    
class TransactionPublic(TransactionBase):
    id: int
    user_id: int
    
# class WebhookPayload(SQLModel):
#     operation_id: str
#     amount: float
#     payment_type: str
#     customer_code: str
#     merchant_id: str
#     purpose: str
#     consumer_id: Optional[str]
#     transaction_id: Optional[str]
#     qrc_id: Optional[str]
#     payer_name: Optional[str]

class WebhookPayload(SQLModel, table=False):
    operation_id: str = Field(..., alias="operationId", description="Идентификатор платежа")
    amount: float = Field(..., description="Сумма платежа")
    payment_type: str = Field(..., alias="paymentType", description="Тип платежа: 'card' или 'sbp'")
    customer_code: Optional[str] = Field(None, alias="customerCode", description="Уникальный идентификатор клиента")
    merchant_id: Optional[str] = Field(None, alias="merchantId", description="Идентификатор торговой точки")
    purpose: str = Field(..., description="Назначение платежа")
    consumer_id: Optional[str] = Field(None, alias="consumerId", description="Идентификатор покупателя (опционально для карты)")
    transaction_id: Optional[str] = Field(None, alias="transactionId", description="Идентификатор платежа в СБП (только для sbp)")
    qrc_id: Optional[str] = Field(None, alias="qrcId", description="Идентификатор QR-кода (только для sbp)")
    payer_name: Optional[str] = Field(None, alias="payerName", description="Имя покупателя (только для sbp)")

    class Config:
        # Включаем использование alias для маппинга ключей из JWT
        populate_by_name = True
        from_attributes = True
        # Разрешаем передачу данных с использованием alias (camelCase)
        alias_generator = lambda field_name: field_name
        