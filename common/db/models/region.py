from typing import List, TYPE_CHECKING, Optional
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .tournament import Tournament
    from .trainer import Trainer

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