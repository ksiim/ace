import json
from aiogram.types import InlineKeyboardMarkup, CallbackQuery, Message
from bot.messaging.producer import send_confirmation
from bot.utils.utils import calculate_payment, find_participant_by_id, get_tournament_data, try_double_json_loads
from dispatcher import bot, dp
from aiogram import F
import logging

from bot.utils.redis import redis

from .markups import (
    prepare_confirm_payment_markup,
    thank_you_for_payment_text
)

logger = logging.getLogger(__name__)


@dp.callback_query(lambda callback: callback.data.startswith("paid:"))
async def send_check_payment_handler(callback: CallbackQuery):
    await callback.answer()
    await callback.message.delete_reply_markup()

    participant_id = int(callback.data.split(":")[1])

    tournament_id, redis_data = await get_tournament_data(participant_id)
    if not redis_data:
        logger.error(f"No data found in Redis for tournament {tournament_id}")
        return

    redis_data = await try_double_json_loads(redis_data)

    participant = await find_participant_by_id(redis_data, participant_id)

    await callback.message.answer(
        text=thank_you_for_payment_text,
    )

    await bot.send_message(
        chat_id=redis_data["organizer"]["telegram_id"],
        text=f"Участник {participant["fio"]} должен(-на) был(-а) перевести {await calculate_payment(redis_data['tournament'])}₽ за участие в турнире {redis_data['tournament']['name']}",
        reply_markup=await prepare_confirm_payment_markup(participant_id)
    )


@dp.callback_query(lambda callback: callback.data.startswith("confirm_payment:"))
async def confirm_payment_handler(callback: CallbackQuery):
    await callback.answer()
    await callback.message.delete_reply_markup()

    participant_id = int(callback.data.split(":")[1])

    tournament_id, redis_data = await get_tournament_data(participant_id)
    if not redis_data:
        logger.error(f"No data found in Redis for tournament {tournament_id}")
        return

    redis_data = await try_double_json_loads(redis_data)

    participant = await find_participant_by_id(redis_data, participant_id)

    await bot.send_message(
        chat_id=redis_data["organizer"]["telegram_id"],
        text=f"Вы подтвердили оплату {participant['fio']} за участие в турнире {redis_data['tournament']['name']}"
    )

    await bot.send_message(
        chat_id=participant["telegram_id"],
        text="Ваше участие было подтверждено организатором!"
    )

    await redis.delete(f"participant:{participant_id}")
    await redis.delete(f"tournament:{tournament_id}")

    await send_confirmation(tournament_id, participant_id)

    logger.info(
        f"Payment confirmed for participant {participant_id} in tournament {tournament_id}")
