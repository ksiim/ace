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
    operationId: str = Field(..., description="Идентификатор платежа")
    amount: float = Field(..., description="Сумма платежа")
    paymentType: str = Field(..., description="Тип платежа: 'card' или 'sbp'")
    customerCode: Optional[str] = Field(None, description="Уникальный идентификатор клиента")
    merchantId: Optional[str] = Field(None, description="Идентификатор торговой точки")
    purpose: str = Field(..., description="Назначение платежа")
    consumerId: Optional[str] = Field(None, description="Идентификатор покупателя (опционально для карты)")
    transactionId: Optional[str] = Field(None, description="Идентификатор платежа в СБП (только для sbp)")
    qrcId: Optional[str] = Field(None, description="Идентификатор QR-кода (только для sbp)")
    payerName: Optional[str] = Field(None, description="Имя покупателя (только для sbp)")

    class Config:
        from_attributes = True  # Поддержка создания из атрибутов
        