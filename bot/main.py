import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from bot import dp, bot

import logging

import handlers

from utils import tasks



logging.basicConfig(level=logging.INFO)

async def main():
    initialize_scheduler()
    await dp.start_polling(bot)

def initialize_scheduler():
    scheduler = AsyncIOScheduler()
    scheduler.add_job(tasks.mail_four_days_before_tournament, trigger="cron", hour=2)
    # scheduler.add_job(tasks.mail_four_days_before_tournament, trigger="interval", seconds=5)
    scheduler.start()

if __name__ == "__main__":
    asyncio.run(main())