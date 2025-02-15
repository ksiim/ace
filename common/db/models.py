import datetime
from typing import List, Optional, Literal
from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy.orm import relationship as sa_relationship

user_roles = Literal["admin", "user", "organizer"]
match_type = Literal["solo", "duo"]

class UserBase(SQLModel):
    name: str = Field(max_length=255, nullable=True)
    surname: str = Field(max_length=255, nullable=True)
    patronymic: str = Field(max_length=255, nullable=True)
    admin: bool = Field(default=False)
    # role: user_roles = Field(default="user")
    end_of_subscription: Optional[datetime.datetime] = Field(default=None, nullable=True)
    updated_at: Optional[datetime.datetime] = Field(default_factory=datetime.datetime.now, nullable=True)
    created_at: Optional[datetime.datetime] = Field(default_factory=datetime.datetime.now, nullable=True)
    phone_number: Optional[str] = Field(default=None, nullable=True)
    email: EmailStr = Field(max_length=255, nullable=True)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)
    
class UserRegister(SQLModel):
    email: EmailStr
    password: str
    name: str
    surname: str
    patronymic: str
    phone_number: str
    
class UserUpdate(UserBase):
    role: user_roles | None = Field(default="user")
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.now)


class UserUpdateMe(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    surname: str | None = Field(default=None, max_length=255)
    patronymic: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


class UserPublic(UserBase):
    id: int


class User(UserBase, table=True):
    __tablename__ = 'users'
    id: int = Field(primary_key=True)
    hashed_password: str | None = Field(default=None, nullable=True)

class UsersPublic(SQLModel):
    data: List[UserPublic]
    count: int

class SexBase(SQLModel):
    name: str
    shortname: str


class Sex(SexBase, table=True):
    __tablename__ = "sex"
    id: int = Field(primary_key=True)
    tournaments: List["Tournament"] = Relationship(back_populates="sex")


class RegionBase(SQLModel):
    name: str


class Region(RegionBase, table=True):
    __tablename__ = "regions"
    id: int = Field(primary_key=True)
    tournaments: List["Tournament"] = Relationship(back_populates="region")
    trainers: List["Trainer"] = Relationship(back_populates="region")


class CategoryBase(SQLModel):
    name: str
    is_child: bool = Field(default=False)


class Category(CategoryBase, table=True):
    __tablename__ = "categories"
    id: int = Field(primary_key=True)
    tournaments: List["Tournament"] = Relationship(back_populates="category")


class TournamentBase(SQLModel):
    name: str
    # type: match_type
    is_child: bool = Field(default=False)
    photo: str = Field(default=None)
    organizer_name_and_contacts: Optional[str] = None
    organizer_requisites: Optional[str] = None
    date: Optional[datetime.datetime] = None
    price: Optional[int] = None
    can_register: bool = Field(default=True)
    address: Optional[str] = None
    prize_fund: Optional[int] = None


class Tournament(TournamentBase, table=True):
    __tablename__ = "tournaments"
    id: int = Field(primary_key=True)
    region_id: int = Field(foreign_key="regions.id")
    sex_id: Optional[int] = Field(default=None, foreign_key="sex.id")
    category_id: int = Field(foreign_key="categories.id")
    
    region: Region = Relationship(back_populates="tournaments")
    sex: Optional[Sex] = Relationship(back_populates="tournaments")
    category: Category = Relationship(back_populates="tournaments")
    participants: List["TournamentParticipant"] = Relationship(
        back_populates="tournament",
        sa_relationship=sa_relationship(
            "TournamentParticipant",
            back_populates="tournament"
        )
    )


class TournamentParticipantBase(SQLModel):
    confirmed: bool = Field(default=False)


class TournamentParticipant(TournamentParticipantBase, table=True):
    __tablename__ = "tournament_participants"
    id: int = Field(primary_key=True)
    tournament_id: int = Field(foreign_key="tournaments.id")
    user_id: int = Field(foreign_key="users.id")
    partner_id: Optional[int] = Field(default=None, foreign_key="users.id")
    user: User = Relationship()
    partner: Optional[User] = Relationship()
    tournament: Tournament = Relationship(back_populates="participants")


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
    
class Message(SQLModel):
    message: str

class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)