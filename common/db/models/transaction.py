import datetime
from typing import Optional
from sqlmodel import Field, SQLModel


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
    
    user_id: int = Field(foreign_key="users.id")
    

class TransactionCreate(TransactionBase):
    user_id: int
    
    
class TransactionPublic(TransactionBase):
    id: int
    user_id: int