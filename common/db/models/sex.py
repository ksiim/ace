from typing import List, TYPE_CHECKING, Optional
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .tournament import Tournament

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