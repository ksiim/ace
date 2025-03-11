from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton

from .callbacks import *


thank_you_for_payment_text = "Спасибо за оплату! Дождитесь ее подтверждения организатором."


async def generate_start_text(message):
    return f"Привет, {message.from_user.full_name}! Я - бот. Для того, чтобы узнать свой ID - введите команду /id"


async def prepare_paid_markup(participant_id: int) -> InlineKeyboardMarkup:
    """Подготавливает клавиатуру для отправки уведомления участникам."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Подтвердить",
                    callback_data=f"paid:{participant_id}"
                )
            ]
        ]
    )

async def prepare_confirm_payment_markup(participant_id: int) -> InlineKeyboardMarkup:
    """Подготавливает клавиатуру для подтверждения оплаты участником"""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Подтвердить оплату",
                    callback_data=f"confirm_payment:{participant_id}"
                )
            ]
        ]
    )