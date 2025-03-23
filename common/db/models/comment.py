import datetime
from typing import List, Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel


if TYPE_CHECKING:
    from .news import News
    from .user import User


class CommentBase(SQLModel):
    text: str
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.now
    )


class Comment(CommentBase, table=True):
    __tablename__ = "comments"
    id: Optional[int] = Field(primary_key=True, default=None)

    creator_id: int = Field(foreign_key="users.id", ondelete="CASCADE")
    news_id: int = Field(foreign_key="news.id", ondelete="CASCADE")
    
    creator: "User" = Relationship(back_populates="comments")
    news: "News" = Relationship(back_populates="comments")


class CommentCreate(CommentBase):
    creator_id: int
    news_id: int


class CommentUpdate(CommentBase):
    pass


class CommentPublic(CommentBase):
    id: int
    creator_id: int
    news_id: int


class CommentsPublic(SQLModel):
    data: List[CommentPublic]
    count: int