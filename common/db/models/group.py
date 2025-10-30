import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlmodel import Field, Relationship, SQLModel


if TYPE_CHECKING:
    from .tournament import Tournament
    from .participant import TournamentParticipant


class GroupStageBase(SQLModel):
    name: str  # например "Группа A"
    number: int  # порядковый номер (1,2,...)
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.now,
    )


class GroupStage(GroupStageBase, table=True):
    __tablename__ = "group_stage"
    id: Optional[int] = Field(primary_key=True)

    tournament_id: int = Field(
        foreign_key="tournaments.id",
        ondelete="CASCADE",
    )
    tournament: "Tournament" = Relationship(back_populates="groups")

    participants: List["GroupParticipant"] = Relationship(
        back_populates="group",
        passive_deletes="all",
    )
    matches: List["GroupMatch"] = Relationship(
        back_populates="group",
        passive_deletes="all",
    )


class GroupStageCreate(GroupStageBase):
    participants_ids: Optional[List[int]] = Field(default_factory=list)


class GroupStageUpdate(SQLModel):
    name: Optional[str]
    number: Optional[int]


class GroupStagePublic(GroupStageBase):
    id: int
    tournament_id: int


class GroupStagesPublic(SQLModel):
    data: List[GroupStagePublic]
    count: int


class GroupParticipantBase(SQLModel):
    joined_at: datetime.datetime = Field(
        default_factory=datetime.datetime.now,
    )


class GroupParticipant(GroupParticipantBase, table=True):
    __tablename__ = "group_participants"
    id: Optional[int] = Field(primary_key=True)

    group_id: int = Field(
        foreign_key="group_stage.id",
        ondelete="CASCADE",
    )
    participant_id: int = Field(
        foreign_key="tournament_participants.id",
        ondelete="CASCADE"
    )

    group: "GroupStage" = Relationship(back_populates="participants")
    participant: "TournamentParticipant" = Relationship(
        back_populates="group_links",
    )


class GroupParticipantCreate(GroupParticipantBase):
    group_id: int
    participant_id: int


class GroupParticipantUpdate(SQLModel):
    joined_at: Optional[datetime.datetime]


class GroupParticipantPublic(GroupParticipantBase):
    id: int
    group_id: int
    participant_id: int


class GroupParticipantsPublic(SQLModel):
    data: List[GroupParticipantPublic]
    count: int


class GroupMatchBase(SQLModel):
    score1: Optional[int] = None
    score2: Optional[int] = None
    played: bool = Field(default=False)


class GroupMatch(GroupMatchBase, table=True):
    __tablename__ = "group_matches"
    id: Optional[int] = Field(primary_key=True)

    group_id: int = Field(
        foreign_key="group_stage.id",
        ondelete="CASCADE",
    )
    participant1_id: int = Field(
        foreign_key="tournament_participants.id",
        ondelete="CASCADE"
    )
    participant2_id: int = Field(
        foreign_key="tournament_participants.id",
        ondelete="CASCADE"
    )
    
    scheduled_at: Optional[datetime.datetime] = Field(default=None)
    created_at: datetime.datetime = Field(
        default_factory=datetime.datetime.now,
    )

    group: "GroupStage" = Relationship(back_populates="matches")
    participant1: "TournamentParticipant" = Relationship(
        back_populates="matches_as_p1",
        sa_relationship_kwargs={
            "primaryjoin": "GroupMatch.participant1_id==TournamentParticipant.id"
        }
    )
    participant2: "TournamentParticipant" = Relationship(
        back_populates="matches_as_p2",
        sa_relationship_kwargs={
            "primaryjoin": "GroupMatch.participant2_id==TournamentParticipant.id"
        }
    )


class GroupMatchCreate(GroupMatchBase):
    group_id: int
    participant1_id: int
    participant2_id: int


class GroupMatchUpdate(SQLModel):
    score1: Optional[int]
    score2: Optional[int]
    played: Optional[bool]
    scheduled_at: Optional[datetime.datetime] = (
        Field(default=datetime.datetime.now())
    )


class GroupMatchPublic(GroupMatchBase):
    id: int
    group_id: int
    participant1_id: int
    participant2_id: int


class GroupMatchesPublic(SQLModel):
    data: List[GroupMatchPublic]
    count: int


class GroupPreviewRequest(SQLModel):
    group_size: int
