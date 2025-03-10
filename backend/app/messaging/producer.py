import aio_pika
import json
import logging
from aio_pika import Message

from backend.app.core.config import settings

logger = logging.getLogger(__name__)

async def send_tournament_notification_task(tournament_id: int, notification_date: str):
    """Отправка задачи в очередь для уведомления участников турнира."""
    connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
    try:
        channel = await connection.channel()
        queue = await channel.declare_queue("tournament_notifications", durable=True)
        
        task = {
            "tournament_id": tournament_id,
            "notification_date": notification_date  # ISO-формат, например "2025-03-16T10:00:00"
        }
        message_body = json.dumps(task).encode()
        
        await channel.default_exchange.publish(
            Message(body=message_body),
            routing_key="tournament_notifications"
        )
        logger.info(f"Sent task to queue: {task}")
    finally:
        await connection.close()