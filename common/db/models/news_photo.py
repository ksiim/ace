from typing import Optional

from sqlmodel import Field, SQLModel


class NewsPhotoBase(SQLModel):
    photo_path: str
    order_num: Optional[int] = Field(default=None, nullable=True)


class NewsPhotoCreate(NewsPhotoBase):
    news_id: int


class NewsPhoto(NewsPhotoBase, table=True):
    id: int = Field(primary_key=True)
    news_id: int = Field(foreign_key="news.id", ondelete="CASCADE")


class NewsPhotoPublic(NewsPhotoBase, table=False):
    id: int


class NewsPhotosPublic(SQLModel):
    data: list[NewsPhotoPublic]
    count: int
