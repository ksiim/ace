# bot/messaging/consumer.py
import datetime
import aio_pika
import asyncio
import json
import logging

from aio_pika import Message, ExchangeType
from bot.handlers.markups import prepare_paid_markup
from bot.settings import settings
from bot.utils.rabbitmq import _connect_to_rabbitmq
from bot.utils.redis import redis
from bot.dispatcher import bot
from bot.utils.utils import calculate_payment, try_double_json_loads

logger = logging.getLogger(__name__)


async def start_consumer() -> None:
    """Запускает consumer для обработки сообщений из RabbitMQ."""
    connection = await _connect_to_rabbitmq()
    async with connection:
        channel = await connection.channel()
        exchange = await _setup_tournament_exchange(channel)
        queue = await _setup_tournament_queue(channel, exchange)
        await queue.consume(_process_message)
        logger.info("Bot consumer started, waiting for messages...")
        await asyncio.Future()


async def _setup_tournament_exchange(channel: aio_pika.Channel) -> aio_pika.Exchange:
    """Настраивает exchange для получения сообщений о турнирах."""
    exchange = await channel.declare_exchange("tournament", ExchangeType.DIRECT)
    logger.info("Exchange 'tournament' set up")
    return exchange


async def _setup_tournament_queue(channel: aio_pika.Channel, exchange: aio_pika.Exchange) -> aio_pika.Queue:
    """Настраивает очередь для получения сообщений о турнирах."""
    queue = await channel.declare_queue("tournament_money_queue", durable=True)
    await queue.bind(exchange, "tournament_money_request")
    logger.info("Queue 'tournament_money_queue' set up and bound")
    return queue


async def _process_message(message: aio_pika.IncomingMessage) -> None:
    """Обрабатывает входящее сообщение от producer'а."""
    async with message.process():
        decoded_message_body = message.body.decode()
        data = await try_double_json_loads(decoded_message_body)

        tournament_id = data["tournament"]["id"]

        redis_key = f"tournament:{tournament_id}"
        redis_data_json = await redis.get(redis_key)
        if not redis_data_json:
            logger.error(
                f"No data found in Redis for tournament {tournament_id}")
            return

        redis_data = await try_double_json_loads(redis_data_json)
        tournament = redis_data["tournament"]
        organizer = redis_data["organizer"]
        participants = redis_data["participants"]

        logger.info(f"Received message for tournament {tournament_id}")

        text_message = await _prepare_text_message(tournament, organizer)
        for participant in participants:
            markup = await prepare_paid_markup(participant_id=participant["id"])
            await bot.send_message(
                chat_id=participant["telegram_id"],
                text=text_message,
                reply_markup=markup
            )
    logger.info(msg=f"Exited process_message for tournament {tournament_id}")


async def _prepare_text_message(tournament: dict, organizer: dict) -> str:
    """Подготавливает текст уведомления для участников."""
    return f"""
Здравствуйте! Организатор турнира {tournament['name']} - {organizer['name_and_contacts']}
Дата: {datetime.datetime.fromisoformat(tournament['date']).strftime("%d.%m")},
Категория: {tournament['category']}
Регион: "{tournament['region']}"
просит вас перевести {await calculate_payment(tournament)}₽ по реквизитам:

{organizer['requisites']}

После оплаты нажмите кнопку "Подтвердить" ниже.
"""
