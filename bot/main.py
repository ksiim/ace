import asyncio
import os
import logging
from dispatcher import bot, dp
import handlers
from watchfiles import awatch


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_bot():
    """Запуск бота с polling."""
    logger.info("Starting bot polling...")
    try:
        await dp.start_polling(bot) 
        await asyncio.Event().wait()
    finally:
        logger.info("Stopping bot polling...")
        await dp.stop_polling()

async def watch_and_restart():
    """Асинхронно следим за изменениями и перезапускаем бота."""
    paths = ["./bot", "./common"] 
    current_task = asyncio.create_task(run_bot())

    async for changes in awatch(*paths):
        if current_task:
            logger.info("Cancelling previous bot instance...")
            current_task.cancel()
            try:
                await current_task
            except asyncio.CancelledError:
                logger.info("Previous bot instance cancelled.")

        change_details = [(event, path) for event, path in changes]
        logger.info(f"Detected changes: {change_details}. Starting new bot instance...")
        current_task = asyncio.create_task(run_bot())
        await asyncio.sleep(1)
        

async def main():
    """Основная точка входа."""
    if os.getenv("ENV") == "development":
        await watch_and_restart()
    else:
        await run_bot()

if __name__ == "__main__":
    asyncio.run(main())