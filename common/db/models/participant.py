from typing import Optional, TYPE_CHECKING, List
from sqlmodel import Field, Relationship, SQLModel

from sqlalchemy.orm import relationship as sa_relationship


if TYPE_CHECKING:
    from .tournament import Tournament
    from .user import User
    from .group import GroupParticipant, GroupMatch


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
            "User", foreign_keys="[TournamentParticipant.partner_id]"),
    )
    tournament: "Tournament" = Relationship(back_populates="participants")
    group_links: List["GroupParticipant"] = Relationship(
        back_populates="participant",
        sa_relationship=sa_relationship(
            "GroupParticipant",
            back_populates="participant",
            cascade="all, delete, delete-orphan",
        )
    )
    matches_as_p1: List["GroupMatch"] = Relationship(
        back_populates="participant1",
        sa_relationship=sa_relationship(
            "GroupMatch",
            back_populates="participant1",
            foreign_keys="[GroupMatch.participant1_id]",
            cascade="all, delete, delete-orphan",
        )
    )
    matches_as_p2: List["GroupMatch"] = Relationship(
        back_populates="participant2",
        sa_relationship=sa_relationship(
            "GroupMatch",
            back_populates="participant2",
            foreign_keys="[GroupMatch.participant2_id]",
            cascade="all, delete, delete-orphan",
        )
    )


class TournamentParticipantCreate(TournamentParticipantBase):
    tournament_id: int
    user_id: int
    partner_id: Optional[int] = None


class TournamentParticipantUpdate(TournamentParticipantBase):
    user_id: Optional[int]
    partner_id: Optional[int]


class TournamentParticipantPublic(TournamentParticipantBase):
    id: int
    user_id: int
    partner_id: Optional[int]


class TournamentParticipantsPublic(SQLModel):
    data: List[TournamentParticipantPublic]
    count: int
