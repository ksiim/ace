# backend/app/messaging/producer.py
import aio_pika
import json
import logging
from typing import List
from aio_pika import Message, ExchangeType
from backend.app.utils.rabbitmq import _connect_to_rabbitmq
from backend.app.utils.utils import redis
from backend.app.core.config import settings

from common.db.models.participant import TournamentParticipant
from common.db.models.tournament import Tournament

logger = logging.getLogger(__name__)

async def send_tournament_money_request_task(tournament: Tournament, participants: List[TournamentParticipant]) -> None:
    """Отправляет запрос на оплату турнира в RabbitMQ."""
    connection = await _connect_to_rabbitmq()
    
    
    redis_key = f"tournament:{tournament.id}"
    redis_data = _generate_tournament_payload(tournament, participants)
    redis_data = json.dumps(redis_data)
    await redis.set(redis_key, redis_data, ex=604800)
    for participant in participants:
        await redis.set(f"participant:{participant.id}", tournament.id, ex=604800)
    
    async with connection:
        channel = await connection.channel()
        exchange = await _setup_exchange(channel)
        await _setup_queue(channel, exchange)
        await _publish_message(exchange, redis_data)
        logger.info(f"Money request sent for tournament {tournament.id}")

def _generate_tournament_payload(tournament: Tournament, participants: List[TournamentParticipant]) -> dict:
    return {
        "tournament": {
            "id": tournament.id,
            "name": tournament.name,
            "date": tournament.date.isoformat(),
            "category": tournament.category.name,
            "region": tournament.region.name,
            "type": tournament.type,
            "price": tournament.price,
        },
        "organizer": {
            "telegram_id": tournament.owner.telegram_id,
            "name_and_contacts": tournament.organizer_name_and_contacts,
            "requisites": tournament.organizer_requisites
        },
        "participants": [
            {
                "id": participant.id,
                "telegram_id": participant.user.telegram_id,
                "fio": f"{participant.user.surname} {participant.user.name} {participant.user.patronymic}",
            }
            for participant in participants
        ]
    }

async def _setup_exchange(channel: aio_pika.Channel) -> aio_pika.Exchange:
    """Настраивает exchange для отправки сообщений."""
    exchange = await channel.declare_exchange("tournament", ExchangeType.DIRECT)
    logger.info("Exchange 'tournament' set up")
    return exchange

async def _setup_queue(channel: aio_pika.Channel, exchange: aio_pika.Exchange) -> None:
    """Настраивает очередь и привязывает ее к exchange."""
    queue = await channel.declare_queue("tournament_money_queue", durable=True)
    await queue.bind(exchange, "tournament_money_request")
    logger.info("Queue 'tournament_money_queue' set up and bound")

async def _publish_message(exchange: aio_pika.Exchange, message_data: dict) -> None:
    """Публикует сообщение в exchange."""
    message = Message(
        body=json.dumps(message_data).encode(),
        content_type="application/json",
        delivery_mode=aio_pika.DeliveryMode.PERSISTENT
    )
    await exchange.publish(message, routing_key="tournament_money_request")
    logger.info("Message published to 'tournament' exchange")