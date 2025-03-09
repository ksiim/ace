from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties

from settings import settings

bot = Bot(token=settings.bot_token, default=DefaultBotProperties(parse_mode='HTML'))

dp = Dispatcher() 
