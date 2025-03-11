import json

from bot.utils.redis import redis


async def try_double_json_loads(data: str) -> dict:
    loads = json.loads(data)
    if isinstance(loads, str):
        return json.loads(loads)
    return loads


async def calculate_payment(tournament: dict) -> int:
    """Вычисляет сумму оплаты для участника."""
    if tournament["type"] == 'solo':
        multiplier = 1
    elif tournament["type"] == 'duo':
        multiplier = 2

    price = int(tournament["price"])

    return price * multiplier



async def get_tournament_data(participant_id: int) -> tuple:
    """Получает данные турнира из Redis по ID участника."""
    redis_key = f"participant:{participant_id}"
    tournament_id = await redis.get(redis_key)

    redis_data = await redis.get(f"tournament:{tournament_id}")
    return tournament_id, redis_data

async def find_participant_by_id(data: dict, participant_id: int | str) -> dict | None:
    """
    Находит участника по participant_id в объекте.
    Возвращает словарь с данными участника или None, если не найдено.
    """
    participants = data.get("participants", [])
    return next((p for p in participants if p["id"] == participant_id), None)
