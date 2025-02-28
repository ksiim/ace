import datetime
from typing import List, Optional, Literal
from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel
from sqlalchemy.orm import relationship as sa_relationship


class UserBase(SQLModel):
    name: str = Field(max_length=255, nullable=True)
    surname: str = Field(max_length=255, nullable=True)
    patronymic: str = Field(max_length=255, nullable=True)
    admin: bool = Field(default=False)
    organizer: bool | None = Field(default=False, nullable=True)
    end_of_subscription: Optional[datetime.datetime] = Field(
        default=None, nullable=True)
    updated_at: Optional[datetime.datetime] = Field(
        default_factory=datetime.datetime.now, nullable=True)
    created_at: Optional[datetime.datetime] = Field(
        default_factory=datetime.datetime.now, nullable=True)
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
    email: EmailStr | None = Field(
        default=None, max_length=255)  # type: ignore
    updated_at: datetime.datetime = Field(
        default_factory=datetime.datetime.now)


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
    id: Optional[int] = Field(primary_key=True, default=None)
    hashed_password: str | None = Field(default=None, nullable=True)

    tournaments: List["Tournament"] = Relationship(back_populates="owner")


class UsersPublic(SQLModel):
    data: List[UserPublic]
    count: int


class SexBase(SQLModel):
    name: str
    shortname: str


class Sex(SexBase, table=True):
    __tablename__ = "sex"
    id: Optional[int] = Field(primary_key=True, default=None)
    tournaments: List["Tournament"] = Relationship(back_populates="sex")


class SexCreate(SexBase):
    pass


class SexPublic(SexBase):
    id: int


class SexesPublic(SQLModel):
    data: List[SexPublic]
    count: int


class SexUpdate(SexBase):
    pass


class RegionBase(SQLModel):
    name: str


class Region(RegionBase, table=True):
    __tablename__ = "regions"
    id: Optional[int] = Field(primary_key=True, default=None)
    tournaments: List["Tournament"] = Relationship(back_populates="region")
    trainers: List["Trainer"] = Relationship(back_populates="region")


class RegionCreate(RegionBase):
    pass


class RegionPublic(RegionBase):
    id: int


class RegionsPublic(SQLModel):
    data: List[RegionPublic]
    count: int


class RegionUpdate(RegionBase):
    pass


class CategoryBase(SQLModel):
    name: str
    is_child: bool = Field(default=False)


class Category(CategoryBase, table=True):
    __tablename__ = "categories"
    id: Optional[int] = Field(primary_key=True, default=None)
    tournaments: List["Tournament"] = Relationship(back_populates="category")


class CategoryCreate(CategoryBase):
    pass


class CategoryPublic(CategoryBase):
    id: int


class CategoriesPublic(SQLModel):
    data: List[CategoryPublic]
    count: int


class CategoryUpdate(CategoryBase):
    pass


class TournamentBase(SQLModel):
    name: str
    type: str
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
    id: Optional[int] = Field(primary_key=True, default=None)
    region_id: int = Field(foreign_key="regions.id")
    sex_id: Optional[int] = Field(default=None, foreign_key="sex.id")
    category_id: int = Field(foreign_key="categories.id")
    owner_id: int = Field(foreign_key="users.id")

    owner: User = Relationship(back_populates="tournaments")
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


class TournamentUpdate(TournamentBase):
    owner_id: int | None
    sex_id: int | None
    category_id: int | None
    region_id: int | None


class TournamentCreate(TournamentBase):
    owner_id: int
    sex_id: Optional[int] = None
    category_id: int
    region_id: int


class TournamentPublic(TournamentBase):
    id: int


class TournamentsPublic(SQLModel):
    data: List[TournamentPublic]
    count: int


class TournamentParticipantBase(SQLModel):
    confirmed: bool = Field(default=False, nullable=True)


class TournamentParticipant(TournamentParticipantBase, table=True):
    __tablename__ = "tournament_participants"

    id: Optional[int] = Field(primary_key=True, default=None)
    tournament_id: int = Field(foreign_key="tournaments.id")
    user_id: int = Field(foreign_key="users.id")
    partner_id: Optional[int] = Field(default=None, foreign_key="users.id")

    user: "User" = Relationship(
        sa_relationship=sa_relationship(
            "User", foreign_keys="[TournamentParticipant.user_id]")
    )
    partner: Optional["User"] = Relationship(
        sa_relationship=sa_relationship(
            "User", foreign_keys="[TournamentParticipant.partner_id]")
    )
    tournament: "Tournament" = Relationship(back_populates="participants")


class TournamentParticipantCreate(TournamentParticipantBase):
    tournament_id: int
    user_id: int
    partner_id: Optional[int] = None


class TournamentParticipantUpdate(TournamentParticipantBase):
    user_id: int | None
    partner_id: int | None


class TournamentParticipantPublic(TournamentParticipantBase):
    id: int
    user_id: int
    partner_id: int | None


class TournamentParticipantsPublic(SQLModel):
    data: List[TournamentParticipantPublic]
    count: int


class TrainerBase(SQLModel):
    name: str
    photo: str
    description: str
    phone: Optional[str] = None
    address: Optional[str] = None


class Trainer(TrainerBase, table=True):
    __tablename__ = "trainers"
    id: Optional[int] = Field(primary_key=True, default=None)
    region_id: int = Field(foreign_key="regions.id")
    region: Region = Relationship(back_populates="trainers")


class TrainerCreate(TrainerBase):
    region_id: int


class TrainerUpdate(TrainerBase):
    pass


class TrainerPublic(TrainerBase):
    id: int


class TrainersPublic(SQLModel):
    data: List[TrainerPublic]
    count: int


class NewsBase(SQLModel):
    title: str
    text: str
    photo: str
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.now)


class News(NewsBase, table=True):
    __tablename__ = "news"
    id: Optional[int] = Field(primary_key=True, default=None)

    creator_id: int = Field(foreign_key="users.id")


class NewsCreate(NewsBase):
    creator_id: int


class NewsUpdate(NewsBase):
    pass


class NewsPublic(NewsBase):
    id: int
    creator_id: int


class NewsesPublic(SQLModel):
    data: List[NewsPublic]
    count: int


class CommentBase(SQLModel):
    text: str
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.now)


class Comment(CommentBase, table=True):
    __tablename__ = "comments"
    id: Optional[int] = Field(primary_key=True, default=None)

    creator_id: int = Field(foreign_key="users.id")
    news_id: int = Field(foreign_key="news.id")


class CommentCreate(CommentBase):
    creator_id: int
    news_id: int


class CommentUpdate(CommentBase):
    pass


class CommentPublic(CommentBase):
    id: int


class CommentsPublic(SQLModel):
    data: List[CommentPublic]
    count: int


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
