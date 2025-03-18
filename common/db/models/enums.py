from enum import Enum


class OrderEnum(str, Enum):
    asc = "asc" 
    desc = "desc"
    
class TournamentType(str, Enum):
    duo = "duo"
    solo = "solo"