import datetime
import aio_pika
import json
import logging
import asyncio
from backend.app.core.config import settings


logger = logging.getLogger(__name__)

async def start_consumer():
    connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
    channel = await connection.channel()
    queue = await channel.declare_queue("tournament_notifications", durable=True)
    
    async def consume():
        await queue.consume(process_task)
        logger.info("Started consuming tournament notifications")
        await asyncio.Future()
    
    consumer_task = asyncio.create_task(consume())
    return connection, consumer_task

async def stop_consumer(connection: aio_pika.RobustConnection, consumer_task: asyncio.Task):
    if consumer_task and not consumer_task.done():
        consumer_task.cancel()
        try:
            await consumer_task
        except asyncio.CancelledError:
            logger.info("Consumer task cancelled")
    if connection and not connection.is_closed:
        await connection.close()
        logger.info("RabbitMQ connection closed")

async def process_task(message: aio_pika.IncomingMessage):
    async with message.process():
        body = message.body.decode()
        logger.info(f"Received task: {body}")
        # Здесь будет основная логика
        
async def wait_for_notification_date(task: dict) -> None:
    """Ждём, пока не наступит notification_date."""
    notification_date = datetime.datetime.fromisoformat(task["notification_date"])
    now = datetime.datetime.now()
    if now < notification_date:
        wait_seconds = (notification_date - now).total_seconds()
        logger.info(f"Waiting {wait_seconds} seconds until {notification_date}")
        await asyncio.sleep(wait_seconds)

        