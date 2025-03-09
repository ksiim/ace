from typing import List, Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from .region import Region

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
    region: "Region" = Relationship(back_populates="trainers")

class TrainerCreate(TrainerBase):
    region_id: int

class TrainerUpdate(TrainerBase):
    pass

class TrainerPublic(TrainerBase):
    id: int

class TrainersPublic(SQLModel):
    data: List[TrainerPublic]
    count: int