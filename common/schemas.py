from pydantic import BaseModel

from common.db.models.playoff import BracketType


class PlayoffMatchSchema(BaseModel):
    match_id: int
    participant1_id: int | None
    participant2_id: int | None
    score1: int | None
    score2: int | None
    winner_id: int | None
    played: bool
    order: int | None = None  # Порядок для стабильного рендера на фронте


class PlayoffRoundSchema(BaseModel):
    round_id: int
    number: int
    name: str
    matches: list[PlayoffMatchSchema]


class PlayoffBracketSchema(BaseModel):
    bracket_id: int
    type: BracketType
    rounds: list[PlayoffRoundSchema]


class PlayoffStageSchema(BaseModel):
    stage_id: int
    brackets: list[PlayoffBracketSchema]
