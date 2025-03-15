from typing import List, Optional, TYPE_CHECKING
from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
import datetime

if TYPE_CHECKING:
    from .tournament import Tournament

class UserBase(SQLModel):
    name: str = Field(max_length=255, nullable=True)
    surname: str = Field(max_length=255, nullable=True)
    patronymic: str = Field(max_length=255, nullable=True)
    score: int | None = Field(default=0, nullable=True)
    admin: bool = Field(default=False)
    telegram_id: Optional[int] = Field(default=None, nullable=True)
    organizer: bool | None = Field(default=False, nullable=True)
    end_of_subscription: Optional[datetime.datetime] = Field(default=None, nullable=True)
    updated_at: Optional[datetime.datetime] = Field(default_factory=datetime.datetime.now, nullable=True)
    created_at: Optional[datetime.datetime] = Field(default_factory=datetime.datetime.now, nullable=True)
    phone_number: Optional[str] = Field(default=None, nullable=True)
    email: EmailStr = Field(max_length=255, nullable=True)
    sex: Optional[str] = Field(default=None, nullable=True)
    birth_date: Optional[datetime.date] = Field(default=None, nullable=True)

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)

class UserRegister(SQLModel):
    email: EmailStr
    password: str
    name: str
    surname: str
    patronymic: str
    phone_number: str
    telegram_id: int

class UserUpdate(UserBase):
    email: Optional[EmailStr] = Field(default=None, max_length=255)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.now)

class UserUpdateMe(UserBase):
    email: Optional[EmailStr] = Field(default=None, max_length=255)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.now)

class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)

class UserPublic(UserBase):
    id: int

class UserFio(SQLModel):
    name: str
    surname: str
    patronymic: str

class User(UserBase, table=True):
    __tablename__ = 'users'
    id: Optional[int] = Field(primary_key=True, default=None)
    hashed_password: Optional[str] = Field(default=None, nullable=True)

    tournaments: List["Tournament"] = Relationship(back_populates="owner")
    
    @property
    def fio(self) -> str:
        return f"{self.surname} {self.name} {self.patronymic}"
    
    @property
    def subscriber(self) -> bool:
        return self.end_of_subscription > datetime.datetime.now()

class UsersPublic(SQLModel):
    data: List[UserPublic]
    count: int