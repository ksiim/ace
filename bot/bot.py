from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties

from settings import Settings

bot = Bot(token=Settings.bot_token, default=DefaultBotProperties(parse_mode='HTML'))

dp = Dispatcher() 
