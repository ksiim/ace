import asyncio
import os
import logging
import handlers
from bot.messaging.consumer import start_consumer
from dispatcher import bot, dp
from watchfiles import awatch

a = handlers.start_message_handler

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

async def run_bot():
    """Запуск бота с polling."""
    try:
        await dp.start_polling(bot)
        await asyncio.Event().wait() 
    finally:
        logger.info("Stopping bot polling...")
        await dp.stop_polling()

async def watch_and_restart():
    """Асинхронно следим за изменениями и перезапускаем бота и consumer."""
    paths = ["./bot", "./common"]
    bot_task = asyncio.create_task(run_bot())
    consumer_task = asyncio.create_task(start_consumer())

    async for changes in awatch(*paths):
        if bot_task:
            logger.info("Cancelling previous bot instance...")
            bot_task.cancel()
            consumer_task.cancel()
            try:
                await bot_task
                await consumer_task
            except asyncio.CancelledError:
                logger.info("Previous bot and consumer instances cancelled.")

        change_details = [(event, path) for event, path in changes]
        logger.info(f"Detected changes: {change_details}. Starting new bot and consumer instances...")
        bot_task = asyncio.create_task(run_bot())
        consumer_task = asyncio.create_task(start_consumer())
        await asyncio.sleep(1)

async def main():
    """Основная точка входа."""
    # await dp.start_polling(bot)
    if os.getenv("ENV") == "development":
        await watch_and_restart()
    else:
        await asyncio.gather(
            run_bot(),
            start_consumer()
        )

if __name__ == "__main__":
    asyncio.run(main())