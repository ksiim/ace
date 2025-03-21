from enum import Enum


class OrderEnum(str, Enum):
    ASC = "asc"
    DESC = "desc"


class TournamentType(str, Enum):
    DUO = "duo"
    SOLO = "solo"
