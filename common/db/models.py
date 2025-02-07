import datetime
from typing import List, Optional
from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy.orm import relationship as sa_relationship



class UserBase(SQLModel):
    telegram_id: int = Field(unique=True, index=True)
    full_name: str = Field(max_length=255, nullable=True)
    username: Optional[str] = Field(default=None, nullable=True)
    admin: bool = Field(default=False)
    is_organizer: Optional[bool] = Field(default=False, nullable=True)
    end_of_subscription: Optional[datetime.datetime] = Field(default=None, nullable=True)
    start_time: Optional[datetime.datetime] = Field(default_factory=datetime.datetime.now, nullable=True)
    from_who: Optional[str] = Field(default=None, nullable=True)
    phone_number: Optional[str] = Field(default=None, nullable=True)
    email: EmailStr = Field(max_length=255, nullable=True)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)



# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: int
    full_name: str | None
    email: EmailStr | None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


class User(UserBase, table=True):
    __tablename__ = 'users'
    
    
    id: int = Field(primary_key=True)
    hashed_password: str | None = Field(default=None, nullable=True)


class SexBase(SQLModel):
    name: str


class Sex(SexBase, table=True):
    __tablename__ = "sex"
    
    
    id: int = Field(primary_key=True)
    tournaments_solo: List["TournamentSolo"] = Relationship(back_populates="sex")
    tournaments_duo: List["TournamentDuo"] = Relationship(back_populates="sex")


class RegionBase(SQLModel):
    name: str


class Region(RegionBase, table=True):
    __tablename__ = "regions"
    
    
    id: int = Field(primary_key=True)
    tournaments_solo: List["TournamentSolo"] = Relationship(back_populates="region")
    tournaments_duo: List["TournamentDuo"] = Relationship(back_populates="region")
    trainers: List["Trainer"] = Relationship(back_populates="region")


class CategoryBase(SQLModel):
    name: str
    child: Optional[bool] = Field(default=False, nullable=True)
    shortname: Optional[str] = None


class Category(CategoryBase, table=True):
    __tablename__ = "categories"
    
    
    id: int = Field(primary_key=True)
    tournaments_solo: List["TournamentSolo"] = Relationship(back_populates="category")
    tournaments_duo: List["TournamentDuo"] = Relationship(back_populates="category")


class TournamentBase(SQLModel):
    name: str
    photo_id: Optional[str] = None
    organizer_name_and_contacts: Optional[str] = None
    organizer_requisites: Optional[str] = None
    organizer_telegram_id: Optional[int] = None
    date: Optional[datetime.datetime] = None
    price: Optional[int] = None
    can_register: bool = Field(default=True)
    address: Optional[str] = None
    prize_fund: Optional[int] = None
    
class UserPairBase(SQLModel):
    user1_fio: Optional[str] = Field(default=None, nullable=True)
    user2_fio: Optional[str] = Field(default=None, nullable=True)
    confirmed: Optional[bool] = Field(default=False, nullable=True)


class UserPair(UserPairBase, table=True):
    __tablename__ = "users_pairs"
    
    id: int = Field(primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="users.id")
    tournament_id: int = Field(foreign_key="tournaments_duo.id")
    user: Optional[User] = Relationship()
    tournament: "TournamentDuo" = Relationship(back_populates="user_pairs")


class TournamentSolo(TournamentBase, table=True):
    __tablename__ = "tournaments_solo"
    
    
    id: int = Field(primary_key=True)
    region_id: int = Field(foreign_key="regions.id")
    sex_id: int = Field(foreign_key="sex.id")
    category_id: int = Field(foreign_key="categories.id")
    region: Region = Relationship(back_populates="tournaments_solo")
    sex: Sex = Relationship(back_populates="tournaments_solo")
    category: Category = Relationship(back_populates="tournaments_solo")
    members: List["TournamentSoloMember"] = Relationship(
        back_populates="tournament",
        sa_relationship=sa_relationship("TournamentSoloMember", cascade="all, delete-orphan"),
    )


class TournamentDuo(TournamentBase, table=True):
    __tablename__ = "tournaments_duo"
    
    
    id: int = Field(primary_key=True)
    region_id: int = Field(foreign_key="regions.id")
    sex_id: int = Field(foreign_key="sex.id")
    category_id: int = Field(foreign_key="categories.id")
    region: Region = Relationship(back_populates="tournaments_duo")
    sex: Sex = Relationship(back_populates="tournaments_duo")
    category: Category = Relationship(back_populates="tournaments_duo")
    user_pairs: List["UserPair"] = Relationship(
        back_populates="tournament",
        sa_relationship=sa_relationship("UserPair", cascade="all, delete-orphan"),
    )


class TournamentSoloMemberBase(SQLModel):
    confirmed: bool = Field(default=False)
    fio: Optional[str] = None


class TournamentSoloMember(TournamentSoloMemberBase, table=True):
    __tablename__ = "solo_tournament_members"
    
    
    id: int = Field(primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    tournament_id: int = Field(foreign_key="tournaments_solo.id")
    user: User = Relationship()
    tournament: TournamentSolo = Relationship(back_populates="members")


class TrainerBase(SQLModel):
    name: str
    photo: str
    description: str
    phone: Optional[str] = None
    address: Optional[str] = None


class Trainer(TrainerBase, table=True):
    __tablename__ = "trainers"
    
    
    id: int = Field(primary_key=True)
    region_id: int = Field(foreign_key="regions.id")
    region: Region = Relationship(back_populates="trainers")


class TransactionBase(SQLModel):
    amount: int
    payment_link: str
    operation_id: str
    months: int


class Transaction(TransactionBase, table=True):
    __tablename__ = "transactions"
    
    
    id: int = Field(primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    user: User = Relationship()
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)



# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)