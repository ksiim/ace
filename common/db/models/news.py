import datetime
from typing import List, Optional
from sqlmodel import Field, SQLModel


class NewsBase(SQLModel):
    title: str
    text: str
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.now)


class News(NewsBase, table=True):
    __tablename__ = "news"
    id: Optional[int] = Field(primary_key=True, default=None)

    creator_id: int = Field(foreign_key="users.id")


class NewsCreate(NewsBase):
    photo_paths: List[str]
    creator_id: int


class NewsUpdate(NewsBase):
    pass


class NewsPublic(NewsBase):
    id: int
    creator_id: int


class NewsesPublic(SQLModel):
    data: List[NewsPublic]
    count: int