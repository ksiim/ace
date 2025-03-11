import aio_pika
import asyncio
import json
import logging
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.api.deps import get_db_session
from backend.app.core.config import settings
from backend.app.utils.rabbitmq import _connect_to_rabbitmq
from common.db.models.participant import TournamentParticipant
from common.db.models.user import User

logger = logging.getLogger(__name__)

async def process_confirmation(message: aio_pika.IncomingMessage):
    
    async with get_db_session() as session:
        async with message.process():
            body = message.body.decode()
            data = json.loads(body)
            participant_id = data["participant_id"]
            tournament_id = data["tournament_id"]
            
            logger.info(f"Received confirmation for participant {participant_id} in tournament {tournament_id}")
            
            statement = (
                update(TournamentParticipant)
                .where(TournamentParticipant.id == participant_id)
                .values(confirmed=True)
            )
            await session.execute(statement)
            await session.commit()
            logger.info(f"Participant {participant_id} confirmed for tournament {tournament_id}")

async def start_consumer():
    """Запускает consumer для RabbitMQ и возвращает соединение."""
    connection = await _connect_to_rabbitmq()
    channel = await connection.channel()
    exchange = await channel.declare_exchange("confirmation", aio_pika.ExchangeType.DIRECT)
    queue = await channel.declare_queue("confirmation_queue", durable=True)
    await queue.bind(exchange, routing_key="confirm_tournament_participant")
    
    await queue.consume(process_confirmation)
    logger.info("Backend consumer started, waiting for confirmations...")
    
    return connection

async def stop_consumer(connection: aio_pika.RobustConnection):
    """Останавливает consumer и закрывает соединение с RabbitMQ."""
    if connection and not connection.is_closed:
        await connection.close()
        logger.info("Backend consumer stopped and connection closed")