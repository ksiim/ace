import datetime
from typing import TYPE_CHECKING, List, Optional
from sqlmodel import Field, Relationship, SQLModel


if TYPE_CHECKING:
    from .user import User
    from .comment import Comment


class NewsBase(SQLModel):
    title: str
    text: str
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.now)


class News(NewsBase, table=True):
    __tablename__ = "news"
    id: Optional[int] = Field(primary_key=True, default=None)

    creator_id: int = Field(foreign_key="users.id", ondelete="CASCADE")
    
    creator: "User" = Relationship(back_populates="news")
    comments: List["Comment"] = Relationship(back_populates="news")
    


class NewsCreate(NewsBase):
    photo_paths: List[str]
    creator_id: int


class NewsUpdate(NewsBase):
    photo_paths: List[str]


class NewsPublic(NewsBase):
    id: int
    creator_id: int


class NewsesPublic(SQLModel):
    data: List[NewsPublic]
    count: int