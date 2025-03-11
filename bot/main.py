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
    await dp.start_polling(bot) 

        

async def main():
    await run_bot()

if __name__ == "__main__":
    asyncio.run(main())