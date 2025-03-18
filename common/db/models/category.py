from typing import List, TYPE_CHECKING, Optional
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .tournament import Tournament

class CategoryBase(SQLModel):
    name: str
    is_child: bool = Field(default=False)
    from_age: Optional[int] = Field(default=None, nullable=True)
    to_age: Optional[int] = Field(default=None, nullable=True)

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