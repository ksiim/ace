import asyncio
from aiogram import F
from aiogram.filters.command import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import (
    Message, CallbackQuery, FSInputFile, ChatMemberLeft
)

from bot import dp, bot
from config import CHANNEL_ID

from models.dbs.orm import Orm
from models.dbs.models import *
from utils.payments import Payment

from .callbacks import *
from .markups import *
from .states import *


async def is_in_channel(channel, telegram_id):
    member = await bot.get_chat_member(chat_id=channel, user_id=telegram_id)
    return type(member) != ChatMemberLeft


@dp.message(F.text == subscribe_button_label)
async def subscribe_message_handler(message: Message):
    await message.answer(
        text=buy_subscription_text,
        reply_markup=await generate_buy_subcription_markup()
    )


@dp.message(Command('start'))
async def start_message_handler(message: Message, state: FSMContext):
    await state.clear()

    user = await Orm.get_user_by_telegram_id(message.from_user.id)

    if user is None:
        from_who = message.text[7:] if len(message.text) > 7 else None
        await Orm.create_user(message, from_who)

    if await is_in_channel(CHANNEL_ID, message.from_user.id) is False:
        return await message.answer(
            text=need_to_subscribe_on_our_news_channel_text,
            reply_markup=await generate_channel_markup()
        )

    await send_main_menu_message(message.from_user.id)


@dp.callback_query(F.data == 'check_channel')
async def check_channel_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    if await is_in_channel(CHANNEL_ID, callback.from_user.id) is True:
        await callback.message.delete()
        await start_message_handler(callback, state)
    else:
        await callback.message.delete()
        await callback.message.answer(
            text=need_to_subscribe_on_our_news_channel_text,
            reply_markup=await generate_channel_markup()
        )


@dp.message(F.text == trainers_label)
async def trainers_message_handler(message: Message):
    await message.answer(
        text="Выберите регион для просмотра тренеров",
        reply_markup=await generate_choose_region_markup('see_coaches')
    )


@dp.callback_query(lambda callback: callback.data.startswith('see_coaches'))
async def trainers_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()

    region_id = int(callback.data.split(':')[1])

    await state.update_data(region_id=region_id)

    trainers = await Orm.get_trainers_with_region_id(region_id=region_id)
    trainers_markup = await generate_trainers_markup(trainers)

    await callback.message.answer(
        text=trainers_text,
        reply_markup=trainers_markup
    )


@dp.callback_query(lambda callback: callback.data.startswith('trainer'))
async def trainer_handler(callback: CallbackQuery):
    await callback.answer()
    await callback.message.delete()
    trainer_id = int(callback.data.split(':')[1])
    trainer = await Orm.get_trainer_by_id(trainer_id)

    await callback.message.answer_photo(
        photo=trainer.photo,
        caption=await generate_trainer_text(trainer),
        reply_markup=trainer_back_markup
    )


@dp.callback_query(F.data == 'back_to_trainers')
async def back_to_trainers_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()

    data = await state.get_data()
    region_id = data.get("region_id")

    trainers = await Orm.get_trainers_with_region_id(region_id=region_id)
    trainers_markup = await generate_trainers_markup(trainers)

    await callback.message.answer(
        text=trainers_text,
        reply_markup=trainers_markup
    )


async def send_start_message(message: Message):
    await bot.send_message(
        chat_id=message.from_user.id,
        text=await generate_start_text(message),
    )


@dp.callback_query(lambda callback: callback.data.startswith('sex'))
async def choose_sex_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer('.')
    await callback.message.delete()
    
    if not await Orm.is_subscribed(callback.from_user.id):
        return await callback.message.answer(
            text=buy_subscription_text,
            reply_markup=await generate_buy_subcription_markup()
        )

    sex_id = int(callback.data.split(':')[1])

    await state.update_data(
        sex_id=sex_id
    )

    sex = await Orm.get_sex_by_id(sex_id)

    if sex.name == 'Детский':
        await state.update_data(tournament_type='solo')
        return await callback.message.answer(
            text='Выберите турнир',
            reply_markup=await generate_choose_tournament_keyboard(
                type_='solo',
                region_id=(await state.get_data())["region_id"],
                sex_id=sex.id,
            )
        )

    await callback.message.answer(
        text='Выберите тип турнира',
        reply_markup=await generate_choose_tournament_type_keyboard()
    )
    
@dp.callback_query(lambda callback: callback.data.startswith('buy_subscription'))
async def buy_subscription_handler(callback: CallbackQuery):
    await callback.answer()
    await callback.message.delete()

    months = int(callback.data.split(':')[1])
    amount = prices[str(months)]
    
    user = await Orm.get_user_by_telegram_id(callback.from_user.id)
    
    payment = Payment()
    print(await payment.get_retailers())
    payment_link, operation_id = await payment.get_payment_link_and_operation_id(amount, months)
    
    transaction = Transaction(
        amount=amount,
        payment_link=payment_link,
        operation_id=operation_id,
        months=months,
        user_id=user.id
    )
    
    transaction = await Orm.add_item(transaction)
    
    await callback.message.answer(
        text=f"Перейдите по ссылке для оплаты подписки на {months} месяцев",
        reply_markup=await generate_payment_markup(payment_link, transaction.id)
    )
    
@dp.callback_query(lambda callback: callback.data.startswith('check_sub_pay'))
async def check_subscription_payment_handler(callback: CallbackQuery):
    await callback.answer()
    
    transaction_id = int(callback.data.split(':')[1])
    
    transaction = await Orm.get_transaction_by_id(transaction_id)
    
    payment = Payment()
    status = await payment.get_payment_status(transaction.operation_id)
    
    if status == 'APPROVED':
        await callback.message.delete()
        await Orm.update_user_subscription(transaction.user_id, transaction.months)
        answer = await callback.message.answer(
            text="Оплата подтверждена"
        )
    else:
        answer = await callback.message.answer(
            text="Оплата не подтверждена"
        )
    await asyncio.sleep(4)
    
    await answer.delete()

@dp.callback_query(F.data == 'calendar_of_tournaments')
async def calendar_of_tournaments_handler(callback: CallbackQuery):
    await callback.answer()
    await callback.message.delete()

    await callback.message.answer(
        text="Выберите регион для просмотра календаря турниров",
        reply_markup=await generate_choose_region_markup('see_tournaments')
    )


@dp.callback_query(F.data == 'back_to_sex')
async def back_to_sex(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    
    if not await Orm.is_subscribed(callback.from_user.id):
        return await callback.message.answer(
            text=buy_subscription_text,
            reply_markup=await generate_buy_subcription_markup()
        )

    data = await state.get_data()
    sex_id = data.get('sex_id')
    sex = await Orm.get_sex_by_id(sex_id)
    if sex.name == 'Детский':
        return await callback.message.answer(
            text="Выберите вариант",
            reply_markup=await generate_choose_sex_keyboard(
                from_where='see_tournaments'
            )
        )

    await callback.message.answer(
        text='Выберите тип турнира',
        reply_markup=await generate_choose_tournament_type_keyboard()
    )


@dp.callback_query(lambda callback: callback.data.startswith('type'))
async def choose_tournament_type_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    
    if not await Orm.is_subscribed(callback.from_user.id):
        return await callback.message.answer(
            text=buy_subscription_text,
            reply_markup=await generate_buy_subcription_markup()
        )

    await state.update_data(
        tournament_type=callback.data.split(':')[1]
    )

    data = await state.get_data()

    try:
        await callback.message.answer(
            text="Выберите турнир",
            reply_markup=await generate_choose_tournament_keyboard(
                type_=data["tournament_type"],
                region_id=data["region_id"],
                sex_id=data["sex_id"]
            )
        )
    except Exception as e:
        await callback.message.answer(
            text=main_menu_text,
            reply_markup=await generate_main_menu_markup(callback.from_user.id)
        )

@dp.callback_query(lambda callback: callback.data.startswith('tournament'))
async def choose_tournament_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    
    if not await Orm.is_subscribed(callback.from_user.id):
        return await callback.message.answer(
            text=buy_subscription_text,
            reply_markup=await generate_buy_subcription_markup()
        )

    tournament_id = int(callback.data.split(':')[-1])
    await state.update_data(tournament_id=tournament_id)
    tournament_type = callback.data.split(':')[1]
    match tournament_type:
        case 'solo':
            tournament_type = TournamentSolo
        case 'duo':
            tournament_type = TournamentDuo

    user = await Orm.get_user_by_telegram_id(callback.from_user.id)
    tournament = await Orm.get_tournament_by_id(tournament_id, tournament_type)

    await callback.message.answer_photo(
        photo=tournament.photo_id,
        caption=await generate_tournament_text(tournament),
        reply_markup=await generate_tournament_markup(tournament, user.id)
    )


@dp.callback_query(lambda callback: callback.data.startswith('cancel_register'))
async def cancel_register_on_tournament_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()

    data = await state.get_data()
    tournament_type = data.get("tournament_type")
    if tournament_type is None:
        await callback.answer(
            text="Попробуйте снова",
            show_alert=True
        )
        return await send_main_menu_message(callback.from_user.id)
    tournament_id = callback.data.split(':')[1]
    user = await Orm.get_user_by_telegram_id(callback.from_user.id)

    participant = await Orm.get_tournament_participant(tournament_id, user.id, tournament_type)
    if participant.confirmed:
        return await callback.message.answer(
            text="Вы не можете отменить регистрацию на турнир, так как уже подтвердили оплату",
            reply_markup=await generate_back_to_tournament_markup(tournament_id, tournament_type)
        )
    await Orm.delete_item(participant)

    answer = await callback.message.answer(
        text="Вы успешно отменили регистрацию на турнир"
    )

    await state.set_state(None)

    await asyncio.sleep(2)

    await answer.delete()

    tournament = await Orm.get_tournament_by_id(tournament_id, TournamentSolo if tournament_type == 'solo' else TournamentDuo)

    await callback.message.answer_photo(
        photo=tournament.photo_id,
        caption=await generate_tournament_solo_text(tournament),
        reply_markup=await generate_tournament_markup(tournament, user.id)
    )


@dp.callback_query(lambda callback: callback.data.startswith('register'))
async def register_on_tournament_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()

    tournament_id = int(callback.data.split(':')[1])
    data = await state.get_data()
    tournament_type = data.get("tournament_type")
    if tournament_type is None:
        await callback.answer(
            text="Попробуйте снова",
            show_alert=True
        )
        return await send_main_menu_message(callback.from_user.id)

    tournament_type_class = TournamentSolo if tournament_type == 'solo' else TournamentDuo

    tournament = await Orm.get_tournament_by_id(tournament_id, tournament_type_class)
    days_until_tournament = (tournament.date.date() - datetime.datetime.now().date()).days
    if not tournament.can_register or days_until_tournament <= 4 or days_until_tournament >= 14:
        return await callback.message.answer(
            text="Регистрация на турнир закрыта",
            reply_markup=await generate_back_to_tournament_markup(tournament_id, tournament_type)
        )
    await state.update_data(tournament=tournament)

    await callback.message.answer(
        text="Введите ваше ФИО",
        reply_markup=await generate_back_to_tournament_markup(tournament_id, tournament_type)
    )

    await state.set_state(RegisterOnTournamentState.fio)


@dp.message(RegisterOnTournamentState.fio)
async def register_on_tournament_fio_handler(message: Message, state: FSMContext):
    fio = message.text

    data = await state.get_data()
    tournament = data["tournament"]

    user = await Orm.get_user_by_telegram_id(message.from_user.id)

    if isinstance(tournament, TournamentSolo):
        tournament_member = TournamentSoloMember(
            fio=fio,
            user_id=user.id,
            tournament_id=tournament.id
        )
    elif isinstance(tournament, TournamentDuo):
        tournament_member = UserPair(
            user1_fio=fio,
            user_id=user.id,
            tournament_id=tournament.id
        )

    await Orm.add_item(tournament_member)
    await message.answer(
        text="Вы успешно зарегистрировались на турнир"
    )

    await state.set_state(None)

    await asyncio.sleep(2)

    return await message.answer_photo(
        photo=tournament.photo_id,
        caption=await generate_tournament_solo_text(tournament),
        reply_markup=await generate_tournament_markup(tournament, user.id)
    )


@dp.callback_query(lambda callback: callback.data.startswith('partner'))
async def partner_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()

    participant_id = int(callback.data.split(':')[-1])
    action = callback.data.split(':')[1]
    data = await state.get_data()

    participant = await Orm.get_tournament_participant(
        tournament_id=data["tournament_id"],
        user_id=participant_id,
        tournament_type=TournamentDuo
    )
    match action:
        case 'add':
            await callback.message.answer(
                text="Введите ФИО партнера",
                reply_markup=await generate_back_to_tournament_markup(data["tournament_id"], TournamentDuo)
            )
            return await state.set_state(RegisterOnTournamentState.fio_duo)
        case 'del':
            await Orm.delete_user2_fio(participant.id)
            await callback.message.answer(
                text="Вы успешно удалили партнера"
            )
            await asyncio.sleep(2)

            tournament = await Orm.get_tournament_by_id(data["tournament_id"], TournamentDuo)
            user = await Orm.get_user_by_telegram_id(callback.from_user.id)

            return await callback.message.answer_photo(
                photo=tournament.photo_id,
                caption=await generate_tournament_solo_text(tournament),
                reply_markup=await generate_tournament_markup(tournament, user.id)
            )


@dp.message(RegisterOnTournamentState.fio_duo)
async def register_on_tournament_fio_duo_handler(message: Message, state: FSMContext):
    fio = message.text

    data = await state.get_data()
    tournament_id = data["tournament_id"]

    tournament = await Orm.get_tournament_by_id(tournament_id, TournamentDuo)

    user = await Orm.get_user_by_telegram_id(message.from_user.id)

    tournament_member = await Orm.get_tournament_participant(
        tournament_id=tournament_id,
        user_id=user.id,
        tournament_type=TournamentDuo
    )

    await Orm.add_user2_fio(tournament_member.id, fio)

    await message.answer(
        text="Вы успешно зарегистрировали партнера на турнир"
    )

    await state.set_state(None)

    await asyncio.sleep(2)

    return await message.answer_photo(
        photo=tournament.photo_id,
        caption=await generate_tournament_solo_text(tournament),
        reply_markup=await generate_tournament_markup(tournament, user.id)
    )


@dp.callback_query(lambda callback: callback.data.startswith('participants'))
async def participants_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()

    tournament_id = int(callback.data.split(':')[2])
    tournament_type = callback.data.split(':')[1]

    tournament_type_class = TournamentSolo if tournament_type == 'solo' else TournamentDuo
    tournament = await Orm.get_tournament_by_id(tournament_id, tournament_type_class)

    participants = await Orm.get_tournament_participants(tournament_id, tournament_type_class)

    await callback.message.answer(
        text=await generate_participants_text(tournament, participants),
        reply_markup=await generate_back_to_tournament_markup(tournament_id, tournament_type)
    )


@dp.callback_query(F.data == 'back_to_tournaments')
async def back_to_tournaments_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()

    data = await state.get_data()

    tournament_type = data.get("tournament_type")
    if tournament_type is None:
        await callback.answer(
            text="Попробуйте снова",
            show_alert=True
        )
        return await send_main_menu_message
    await callback.message.answer(
        text="Выберите турнир",
        reply_markup=await generate_choose_tournament_keyboard(
            type_=tournament_type,
            region_id=data["region_id"],
            sex_id=data["sex_id"]
        )
    )


@dp.callback_query(lambda callback: callback.data.startswith('back_to_regions'))
async def back_to_regions_handler(callback: CallbackQuery):
    await callback.answer()
    await callback.message.delete()

    type_ = callback.data.split(':')[1]

    match type_:
        case 'see_tournaments':
            await callback.message.answer(
                text="Выберите регион для просмотра календаря турниров",
                reply_markup=await generate_choose_region_markup('see_tournaments')
            )
        case 'see_coaches':
            await callback.message.answer(
                text="Выберите регион для просмотра тренеров",
                reply_markup=await generate_choose_region_markup('see_coaches')
            )


@dp.callback_query(F.data == 'main_menu')
async def main_menu_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()

    await send_main_menu_message(callback.from_user.id)


@dp.message(Command('donate'))
async def donate_message_handler(message: Message):
    await message.answer(
        text=donate_text,
        parse_mode='HTML'
    )


@dp.message(Command('getmylink'))
async def get_my_link_handler(message: Message):
    await message.answer(
        text=f"Вот ваша ссылка - <code>https://t.me/{(await bot.get_me()).username}?start={message.from_user.id}</code>",
        parse_mode='HTML'
    )


@dp.message(Command('id'))
async def get_id_handler(message: Message):
    await message.answer(
        text=f"Ваш ID: <code>{message.from_user.id}</code>",
        parse_mode='HTML'
    )


async def send_main_menu_message(telegram_id):
    await bot.send_message(
        chat_id=telegram_id,
        text=main_menu_text,
        reply_markup=await generate_main_menu_markup(telegram_id)
    )


@dp.message(F.text == tournament_calendar_label)
async def tournament_calendar_handler(message: Message):
    await message.answer(
        text="Выберите регион для просмотра календаря турниров",
        reply_markup=await generate_choose_region_markup('see_tournaments')
    )


@dp.callback_query(lambda callback: callback.data.startswith('see_tournaments'))
async def tournament_calendar_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    
    if not await Orm.is_subscribed(callback.from_user.id):
        return await callback.message.answer(
            text=buy_subscription_text,
            reply_markup=await generate_buy_subcription_markup()
        )

    region_id = int(callback.data.split(':')[1])

    await state.update_data(region_id=region_id)

    await callback.message.answer(
        text=choose_sex_text,
        reply_markup=await generate_choose_sex_keyboard(from_where='see_tournaments')
    )


@dp.message(F.text == info_about_us_label)
async def info_about_us_handler(message: Message):
    await message.answer(
        text=about_us_text,
        reply_markup=about_us_markup,
        parse_mode='HTML'
    )


@dp.callback_query(F.data == 'about_us_document')
async def about_us_document_handler(callback: CallbackQuery):
    await callback.answer()
    await callback.message.delete()

    await bot.send_document(
        chat_id=callback.from_user.id,
        document=document_file_id
    )

@dp.callback_query(lambda callback: callback.data.startswith('check_pay'))
async def confirm_payment_handler(callback: CallbackQuery):
    await callback.answer()
    await callback.message.delete()

    tournament_type = callback.data.split(':')[1]
    participant_id = int(callback.data.split(':')[2])

    participant = await Orm.get_tournament_participant_by_id(participant_id, tournament_type)

    if isinstance(participant, TournamentSoloMember):
        await bot.send_message(
            chat_id=participant.tournament.organizer_telegram_id,
            text=f"Пользователь {participant.fio} должен был оплатить взнос на турнир {participant.tournament.name} ({participant.tournament.date.date()})",
            reply_markup=await generate_confirm_tournament_payment_markup(tournament_type, participant.id)
        )
    elif isinstance(participant, UserPair):
        await bot.send_message(
            chat_id=participant.tournament.organizer_telegram_id,
            text=f"Пользователь {participant.user1_fio} должен был оплатить взнос за пару ({participant.user1_fio}/{participant.user2_fio if participant.user2_fio else ''}) на турнир {participant.tournament.name} ({participant.tournament.date.date()})",
            reply_markup=await generate_confirm_tournament_payment_markup(tournament_type, participant.id)
        )
    
    await bot.send_message(
        chat_id=participant.user.telegram_id,
        text="Ваш запрос на подтверждение оплаты отправлен организатору"
    )
    
@dp.callback_query(lambda callback: callback.data.startswith('conf_pay'))
async def confirm_payment_handler(callback: CallbackQuery):
    await callback.answer()
    await callback.message.delete()

    tournament_type = callback.data.split(':')[1]
    participant_id = int(callback.data.split(':')[2])

    participant = await Orm.get_tournament_participant_by_id(participant_id, tournament_type)

    await Orm.confirm_payment(participant_id, tournament_type)

    await bot.send_message(
        chat_id=participant.user.telegram_id,
        text="Ваша оплата подтверждена"
    )
    

@dp.message(F.text == my_tournaments_label)
async def my_tournaments_handler(message: Message, state: FSMContext):
    await state.clear()
    user = await Orm.get_user_by_telegram_id(message.from_user.id)
    tournaments = await Orm.get_user_tournaments(user.id)
    
    await message.answer(
        text="Турниры, на которые вы записаны:",
        reply_markup=await generate_tournaments_keyboard_from_list(tournaments)
    )

    
    
# @dp.callback_query(F.data == 'back_to_choose_sex')


# @dp.message()
# async def forward_from(message: Message):
#     await message.answer(
#         text=f"{message.forward_from_chat.id}"
#     )
