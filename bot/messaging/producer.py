import json
import aio_pika
import logging

from bot.utils.rabbitmq import _connect_to_rabbitmq


logger = logging.getLogger(__name__)


async def send_confirmation(tournament_id: int, participant_id: int) -> None:
    """Отправляет подтверждение в backend через RabbitMQ."""
    confirmation_data = {
        "participant_id": participant_id,
        "tournament_id": tournament_id
    }

    connection = await _connect_to_rabbitmq()
    async with connection:
        channel = await connection.channel()
        exchange = await _setup_confirmation_exchange(channel)
        await _setup_confirmation_queue(channel, exchange)
        await _publish_confirmation(exchange, confirmation_data)
        logger.info(
            f"Confirmation sent for participant {participant_id} in tournament {tournament_id}"
        )


async def _setup_confirmation_exchange(channel: aio_pika.Channel) -> aio_pika.Exchange:
    """Настраивает exchange для отправки подтверждений."""
    exchange = await channel.declare_exchange("confirmation", aio_pika.ExchangeType.DIRECT)
    logger.info("Exchange 'confirmation' set up")
    return exchange


async def _setup_confirmation_queue(channel: aio_pika.Channel, exchange: aio_pika.Exchange) -> None:
    """Настраивает очередь для отправки подтверждений."""
    queue = await channel.declare_queue("confirmation_queue", durable=True)
    await queue.bind(exchange, "confirm_tournament_participant")
    logger.info("Queue 'confirmation_queue' set up and bound")


async def _publish_confirmation(exchange: aio_pika.Exchange, confirmation_data: dict) -> None:
    """Публикует сообщение подтверждения в exchange."""
    message = aio_pika.Message(
        body=json.dumps(confirmation_data).encode(),
        content_type="application/json",
        delivery_mode=aio_pika.DeliveryMode.PERSISTENT
    )
    await exchange.publish(message, routing_key="confirm_tournament_participant")
    logger.info("Confirmation message published to 'confirmation' exchange")
