from fastapi import APIRouter, HTTPException
from typing import Optional

from backend.app.api.deps import SessionDep
from backend.app.crud.group_participant import get_participants_by_group
from backend.app.crud.group_stage import get_groups_by_tournament
from sqlalchemy import select
from common.db.models import PlayoffStage, PlayoffBracket, PlayoffRound, PlayoffMatch, BracketType

router = APIRouter()


# Utility: round names by number of participants
ROUND_NAMES = {
    2: "Финал",
    4: "1/2 финала",
    8: "1/4 финала",
    16: "1/8 финала",
    32: "1/16 финала",
    64: "1/32 финала",
}


def get_round_name(n):
    return ROUND_NAMES.get(n, f"{n}-player round")


# Удалено использование bracketool.knockout, строим сетку вручную
async def generate_bracket(session, participants, bracket_type, stage_id):
    """
    Generate bracket, rounds, and matches for given participants (без bracketool).
    В первом раунде назначаются реальные участники, в остальных — participant_id = None.
    """
    import math

    n = len(participants)
    rounds = int(math.log2(n))
    current_participants = [p.id if hasattr(p, "id") else p for p in participants]
    bracket = PlayoffBracket(type=bracket_type, stage_id=stage_id)
    session.add(bracket)
    await session.flush()
    for r in range(rounds):
        round_size = len(current_participants)
        round_model = PlayoffRound(number=r + 1, bracket_id=bracket.id)
        session.add(round_model)
        await session.flush()
        matches = []
        for i in range(0, round_size, 2):
            if r == 0:
                p1_id = current_participants[i]
                p2_id = current_participants[i + 1] if i + 1 < round_size else None
            else:
                p1_id = None
                p2_id = None
            match = PlayoffMatch(
                round_id=round_model.id, participant1_id=p1_id, participant2_id=p2_id
            )
            session.add(match)
            matches.append(match)
        await session.flush()
        # Для следующего раунда: пока нет победителей, просто пустой список
        current_participants = [None for _ in range(round_size // 2)]
    return bracket


@router.post("/create")
async def create_playoff(
    tournament_id: int,
    main_count: int,
    session: SessionDep,
    additional_count: Optional[int] = None,
):
    # Получаем все группы турнира
    groups = await get_groups_by_tournament(tournament_id, session)
    if not groups:
        raise HTTPException(status_code=400, detail="No groups found for tournament")
    # Собираем участников по результатам групп
    group_participants = []
    for group in groups:
        participants = await get_participants_by_group(group.id, session)
        # Собираем статистику по каждому участнику
        stats = []
        for gp in participants:
            p = gp.participant
            # Матчи участника в этой группе
            matches = [
                m
                for m in p.matches_as_p1 + p.matches_as_p2
                if getattr(m, "group_id", None) == group.id and m.played
            ]
            points = 0
            scored = 0
            conceded = 0
            for m in matches:
                if m.participant1_id == p.id:
                    scored += m.score1 or 0
                    conceded += m.score2 or 0
                    if m.score1 is not None and m.score2 is not None:
                        if m.score1 > m.score2:
                            points += 3
                        elif m.score1 == m.score2:
                            points += 1
                elif m.participant2_id == p.id:
                    scored += m.score2 or 0
                    conceded += m.score1 or 0
                    if m.score1 is not None and m.score2 is not None:
                        if m.score2 > m.score1:
                            points += 3
                        elif m.score1 == m.score2:
                            points += 1
            scoreDiff = scored - conceded
            stats.append({
                "participant": p,
                "points": points,
                "scoreDiff": scoreDiff,
                "scored": scored,
                "id": p.id,
            })
        # Сортировка: очки → разница → забитые → id
        sorted_stats = sorted(
            stats, key=lambda x: (-x["points"], -x["scoreDiff"], -x["scored"], x["id"])
        )
        group_participants.append([x["participant"] for x in sorted_stats])
    # Формируем main и additional из каждой группы
    main_participants = []
    additional_participants = []
    for plist in group_participants:
        if main_count:
            main_participants.extend(plist[:main_count])
        if additional_count:
            additional_participants.extend(plist[-additional_count:])
    stage = PlayoffStage(tournament_id=tournament_id)
    session.add(stage)
    await session.flush()
    stage_id = stage.id
    if main_participants:
        await generate_bracket(session, main_participants, BracketType.MAIN, stage_id)
    if additional_participants:
        await generate_bracket(session, additional_participants, BracketType.ADDITIONAL, stage_id)
    await session.commit()
    return {"status": "Playoff created", "stage_id": stage_id}


# 2. Enter match results and auto-advance
@router.post("/match/{match_id}/result")
async def enter_match_result(
    match_id: int,
    score1: int,
    score2: int,
    session: SessionDep,
):
    match = await session.get(PlayoffMatch, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    match.score1 = score1
    match.score2 = score2
    match.played = True
    # Determine winner
    if score1 > score2:
        match.winner_id = match.participant1_id
    elif score2 > score1:
        match.winner_id = match.participant2_id
    else:
        match.winner_id = None  # Draw or error
    session.add(match)
    await session.commit()
    # Auto-advance winner to next round
    # 1. Find round and bracket
    round_obj = await session.get(PlayoffRound, match.round_id)
    bracket = await session.get(PlayoffBracket, round_obj.bracket_id)
    # 2. Find next round
    next_round_number = round_obj.number + 1
    next_round = await session.execute(
        select(PlayoffRound).where(
            PlayoffRound.bracket_id == bracket.id, PlayoffRound.number == next_round_number
        )
    )
    next_round = next_round.scalars().first()
    if next_round:
        # Find all matches in next round
        next_matches = await session.execute(
            select(PlayoffMatch).where(PlayoffMatch.round_id == next_round.id)
        )
        next_matches = next_matches.scalars().all()
        # Find position for winner (first empty slot)
        for nm in next_matches:
            if nm.participant1_id is None:
                nm.participant1_id = match.winner_id
                session.add(nm)
                break
            elif nm.participant2_id is None:
                nm.participant2_id = match.winner_id
                session.add(nm)
                break
        await session.commit()
    return {
        "status": "Result entered",
        "winner_id": match.winner_id if match.winner_id else None,
    }


# 3. Get playoff bracket with stages/rounds/matches
@router.get("/stage/{stage_id}")
async def get_playoff_stage(
    stage_id: int,
    session: SessionDep,
):
    stage = await session.get(PlayoffStage, stage_id)
    if not stage:
        raise HTTPException(status_code=404, detail="Playoff stage not found")
    # Get brackets
    brackets = await session.execute(
        select(PlayoffBracket).where(PlayoffBracket.stage_id == stage_id)
    )
    brackets = brackets.scalars().all()
    result = {"stage_id": stage.id, "brackets": []}
    for bracket in brackets:
        bracket_data = {"bracket_id": bracket.id, "type": bracket.type.value, "rounds": []}
        rounds = await session.execute(
            select(PlayoffRound)
            .where(PlayoffRound.bracket_id == bracket.id)
            .order_by(PlayoffRound.number)
        )
        rounds = rounds.scalars().all()
        for round_obj in rounds:
            matches = await session.execute(
                select(PlayoffMatch).where(PlayoffMatch.round_id == round_obj.id)
            )
            matches = matches.scalars().all()
            matches_data = []
            for m in matches:
                matches_data.append({
                    "match_id": m.id,
                    "participant1_id": m.participant1_id if m.participant1_id else None,
                    "participant2_id": m.participant2_id if m.participant2_id else None,
                    "score1": m.score1,
                    "score2": m.score2,
                    "winner_id": m.winner_id if m.winner_id else None,
                    "played": m.played,
                })
            bracket_data["rounds"].append({
                "round_id": round_obj.id,
                "number": round_obj.number,
                "name": get_round_name(len(matches_data) * 2),
                "matches": matches_data,
            })
        result["brackets"].append(bracket_data)
    return result
