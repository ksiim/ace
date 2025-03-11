import aio_pika

from backend.app.core.config import settings
import logging


logger = logging.getLogger(__name__)

async def _connect_to_rabbitmq() -> aio_pika.RobustConnection:
    """Устанавливает соединение с RabbitMQ."""
    try:
        connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
        logger.info("Connected to RabbitMQ")
        return connection
    except Exception as e:
        logger.error(f"Failed to connect to RabbitMQ: {e}")
        raise