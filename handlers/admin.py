from bot import dp, bot

from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, Message, CallbackQuery
from aiogram.filters.command import Command
from aiogram.fsm.context import FSMContext
from aiogram import F

from models.dbs.models import *

from .callbacks import *
from .markups import *
from .states import *
from .filters import *

from .user import *


@dp.message(Command('admin'), IsAdmin())
async def admin_command_handler(message: Message, state: FSMContext):
    await message.answer(
        text=admin_panel_text,
        reply_markup=admin_panel_markup
    )
    
    
# ---------------------------- TRAINERS ----------------------------
    
@dp.callback_query(F.data == 'delete_coach', IsAdmin())
async def delete_coach_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    
    await callback.message.answer(
        text="Выберите регион тренера, которого хотите удалить",
        reply_markup=await generate_choose_region_markup('delete_coach_region')
    )
    
    
@dp.callback_query(lambda callback: callback.data.startswith('delete_coach_region'), IsAdmin())
async def delete_coach_region_handler(callback: CallbackQuery, state: FSMContext):
    region_id = int(callback.data.split(':')[1])
    await state.update_data(region_id=region_id)
    await callback.message.delete()
    
    coaches = await Orm.get_trainers_with_region_id(region_id)
    await callback.message.answer(
        text="Выберите тренера, которого хотите удалить",
        reply_markup=await generate_trainers_markup(coaches, 'delete_trainer')
    )
    
    
@dp.callback_query(lambda callback: callback.data.startswith('delete_trainer'), IsAdmin())
async def delete_trainer_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    trainer_id = int(callback.data.split(':')[1])
    trainer = await Orm.get_trainer_by_id(trainer_id)
    await callback.message.answer_photo(
        photo=trainer.photo,
        caption=await generate_trainer_text(trainer),
        reply_markup=confirm_delete_trainer_markup
    )
    
    await state.update_data(trainer_id=trainer_id)


@dp.callback_query(lambda callback: callback.data.startswith('confirm_delete_trainer'))
async def confirm_delete_trainer_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    
    if callback.data.split(':')[1] == 'yes':
        data = await state.get_data()
        trainer = await Orm.get_trainer_by_id(data["trainer_id"])
        await Orm.delete_item(trainer)
        await callback.message.answer(
            text=f"Тренер {trainer.name} успешно удален!"
        )
    else:
        await callback.message.delete()
        await callback.message.answer(
            text=f"Тренер не удален"
        )
        
    await state.clear()
    
    
@dp.callback_query(F.data == 'add_coach', IsAdmin())
async def add_coach_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    await callback.message.answer(
        text="Выберите регион тренера:",
        reply_markup=await generate_choose_region_markup('add_coach_region')
    )
    
    await state.set_state(AddCoachState.name)
    
    
@dp.callback_query(lambda callback: callback.data.startswith('add_coach_region'), AddCoachState.name)
async def add_coach_region_handler(callback: CallbackQuery, state: FSMContext):
    region_id = int(callback.data.split(':')[1])
    await state.update_data(region_id=region_id)
    await callback.message.delete()
    await callback.message.answer(
        text="Введите имя тренера"
    )
    
    await state.set_state(AddCoachState.name)
    
@dp.message(AddCoachState.name)
async def add_coach_name_handler(message: Message, state: FSMContext):
    await state.update_data(name=message.text)
    
    await message.answer(
        text="Введите номер телефона тренера"
    )
    await state.set_state(AddCoachState.phone)
    
@dp.message(AddCoachState.phone)
async def add_coach_phone_handler(message: Message, state: FSMContext):
    await state.update_data(phone=message.text)
    await message.answer(
        text="Введите адрес работы тренера"
    )
    
    await state.set_state(AddCoachState.address)
    
@dp.message(AddCoachState.address)
async def add_coach_address_handler(message: Message, state: FSMContext):
    await state.update_data(address=message.text)
    
    await message.answer(
        text="Введите описание тренера"
    )
    
    await state.set_state(AddCoachState.description)
    
@dp.message(AddCoachState.description)
async def add_coach_description_handler(message: Message, state: FSMContext):
    if len(message.text) > 900:
        return await message.answer(
            text="Описание слишком длинное. Попробуйте еще раз."
        )
        
    await state.update_data(description=message.text)
    await message.answer(
        text="Отправьте ОДНО фото тренера"
    )
    
    await state.set_state(AddCoachState.photo)
    
@dp.message(AddCoachState.photo)
async def add_coach_photo_handler(message: Message, state: FSMContext):
    if not message.photo:
        return await message.answer(
            text="Отправьте ОДНО фото"
        )
    
    photo_id = message.photo[-1].file_id
    
    await state.update_data(photo_id=photo_id)
    
    data = await state.get_data()
    
    trainer = Trainer(
        name=data["name"],
        description=data["description"],
        photo=data["photo_id"],
        region=await Orm.get_region_by_id(data["region_id"]),
        phone=data["phone"],
        address=data["address"]
    )
    trainer_text = await generate_trainer_text(trainer=trainer)
    
    await message.answer_photo(
        photo=photo_id,
        caption=trainer_text,
        reply_markup=confirm_add_trainer_markup
    )
    
@dp.callback_query(lambda callback: callback.data.startswith('confirm_add_trainer'))
async def confirm_add_trainer_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    data = await state.get_data()
    
    if callback.data.split(':')[1] == 'yes':
        trainer = Trainer(
            name=data["name"],
            description=data["description"],
            photo=data["photo_id"],
            region_id=data["region_id"]
        )
    else:
        await callback.message.delete()
        return await callback.message.answer(
            text="Тренер не добавлен"
        )
    
    trainer = await Orm.add_item(trainer)
    
    await callback.message.answer(
        text="Тренер успешно добавлен!"
    )
    
    await state.clear()
    
@dp.callback_query(F.data == 'admin_panel', IsAdmin())
async def admin_panel_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    
    await callback.message.answer(
        text=admin_panel_text,
        reply_markup=admin_panel_markup
    )
    
# ---------------------------- END OF TRAINERS ----------------------------

# ---------------------------- TOURNAMENTS ----------------------------

@dp.callback_query(F.data == 'delete_tournament', IsAdmin())
async def delete_tournament_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    
    await callback.message.answer(
        text="Выберите регион турнира, который хотите удалить",
        reply_markup=await generate_choose_region_markup('del_tour_region')
    )
    
@dp.callback_query(lambda callback: callback.data.startswith('del_tour_region'), IsAdmin())
async def delete_tournament_region_handler(callback: CallbackQuery, state: FSMContext):
    region_id = int(callback.data.split(':')[1])
    await state.update_data(region_id=region_id)
    await callback.message.delete()
    
    await callback.message.answer(
        text="Выберите тип турнира, который хотите удалить",
        reply_markup=await generate_choose_type_of_delete_tournament_markup()
    )
    
@dp.callback_query(lambda callback: callback.data.startswith('deltourtype'), IsAdmin())
async def delete_tournament_type_handler(callback: CallbackQuery, state: FSMContext):
    type_ = callback.data.split(':')[1]
    await state.update_data(type_=type_)
    await callback.message.delete()
    
    await callback.message.answer(
        text='Выберите вариант удаления',
        reply_markup=await generate_choose_sex_to_delete_tournament_markup()
    )
    
@dp.callback_query(lambda callback: callback.data.startswith('delsextour'), IsAdmin())
async def delete_tournament_sex_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    
    await state.update_data(sex_id=int(callback.data.split(':')[1]))
    data = await state.get_data()
    await callback.message.answer(
        text=f"Выберите турнир, который вы хотите удалить",
        reply_markup=await generate_choose_tournament_to_delete_markup(data["region_id"], data["sex_id"], data["type_"])
    )
    
@dp.callback_query(lambda callback: callback.data.startswith('del_tour'), IsAdmin())
async def delete_tournament_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    tournament_id = int(callback.data.split(':')[1])
    data = await state.get_data()
    tournament = await Orm.get_tournament_by_id(tournament_id, TournamentSolo if data["type_"] == 'solo' else TournamentDuo)
    await callback.message.answer_photo(
        photo=tournament.photo_id,
        caption=await generate_tournament_solo_text(tournament),
        reply_markup=confirm_delete_tournament_markup
    )
    
    await state.update_data(tournament_id=tournament_id)
    
@dp.callback_query(lambda callback: callback.data.startswith('conf_del_tour'))
async def confirm_delete_tournament_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    
    if callback.data.split(':')[1] == 'yes':
        data = await state.get_data()
        tournament_type_class = TournamentSolo if data["type_"] == 'solo' else TournamentDuo
        tournament = await Orm.get_tournament_by_id(data["tournament_id"], tournament_type_class)
        await Orm.delete_item(tournament)
        await callback.message.answer(
            text=f"Турнир {tournament.name} успешно удален!"
        )
    else:
        await callback.message.delete()
        await callback.message.answer(
            text=f"Турнир не удален"
        )
        
    await state.clear()


@dp.callback_query(F.data == 'add_tournament', IsAdmin())
async def add_tournament_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    
    tournament_region_markup = await generate_choose_region_markup('crad')
    tournament_region_markup.inline_keyboard[-1] = [InlineKeyboardButton(
        text="Назад",
        callback_data="admin_panel"
    )]
    await callback.message.answer(
        text="Выберите регион, в котором будет проходить турнир:",
        reply_markup=tournament_region_markup
    )
    
    await state.set_state(AddTournamentState.region)
    
@dp.callback_query(lambda callback: callback.data.startswith('crad'), AddTournamentState.region)
async def add_tournament_choose_region_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    region_id = int(callback.data.split(':')[1])
    await callback.message.delete()
    
    to_delete_message = await callback.message.answer(
        text="Введите дату начала турнира в формате ДД.ММ.ГГГГ, например: 06.05.2025",
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [tournament_add_back_button]
            ]
        )
    )
    await state.update_data(region_id=region_id, to_delete_message_id=to_delete_message.message_id)
    await state.set_state(AddTournamentState.date)
    
@dp.message(AddTournamentState.date)
async def add_tournament_date_handler(message: Message, state: FSMContext):
    await message.delete()
    data = await state.get_data()
    await bot.delete_message(chat_id=message.chat.id, message_id=data["to_delete_message_id"])
    try:
        date = datetime.datetime.strptime(message.text, "%d.%m.%Y")
    except ValueError:
        to_delete = await message.answer(
            text="Неверный формат даты. Попробуйте еще раз.",
            reply_markup=InlineKeyboardMarkup(
                inline_keyboard=[
                    [tournament_add_back_button]
                ]
            )
        )
        await state.update_data(to_delete_message_id=to_delete.message_id)
        return
    
    tournament_type_markup = await generate_choose_type_of_tournament_markup()
    tournament_type_markup.inline_keyboard.append(
        [tournament_add_back_button]
    )
    to_delete_message = await message.answer(
        text="Выберите тип турнира:",
        reply_markup=tournament_type_markup
    )
    
    await state.update_data(date=date, to_delete_message_id=to_delete_message.message_id)
    await state.set_state(AddTournamentState.type_)
    
@dp.callback_query(lambda callback: callback.data.startswith('att'), AddTournamentState.type_)
async def add_tournament_type_handler(callback: CallbackQuery, state: FSMContext):
    type_ = callback.data.split(':')[1]
    await state.update_data(type_=type_)
    await callback.message.delete()
    
    tournament_sex_markup = await generate_choose_sex_of_tournament_markup()
    tournament_sex_markup.inline_keyboard.append(
        [tournament_add_back_button]
    )
    
    await callback.message.answer(
        text="Выберите пол участников турнира:",
        reply_markup=tournament_sex_markup
    )
    
    await state.set_state(AddTournamentState.sex)
    
@dp.callback_query(lambda callback: callback.data.startswith('csot'), AddTournamentState.sex)
async def add_tournament_sex_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    sex_id = int(callback.data.split(':')[1])
    await callback.message.delete()
    
    to_delete = await callback.message.answer(
        text="Введите название турнира",
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [tournament_add_back_button]
            ]
    ))

    await state.update_data(sex_id=sex_id, to_delete_message_id=to_delete.message_id)
    await state.set_state(AddTournamentState.name)
    
@dp.message(AddTournamentState.name)
async def add_tournament_name_handler(message: Message, state: FSMContext):
    await message.delete()
    data = await state.get_data()
    await bot.delete_message(chat_id=message.chat.id, message_id=data["to_delete_message_id"])
    
    to_delete = await message.answer(
        text="Отправьте призовой фонд турнира. Если его нет, отправьте 0",
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [tournament_add_back_button]
            ]
        )
    )
    
    await state.update_data(name=message.text, to_delete_message_id=to_delete.message_id)
    await state.set_state(AddTournamentState.prize_fund)

    
    
@dp.message(AddTournamentState.prize_fund)
async def add_tournament_prize_fund_handler(message: Message, state: FSMContext):
    await message.delete()
    data = await state.get_data()
    await bot.delete_message(chat_id=message.chat.id, message_id=data["to_delete_message_id"])
    try:
        prize_fund = int(message.text)
    except ValueError:
        to_delete = await message.answer(
            text="Неверный формат призового фонда. Введите ЦЕЛОЕ число.",
            reply_markup=InlineKeyboardMarkup(
                inline_keyboard=[
                    [tournament_add_back_button]
                ]
            )
        )
        await state.update_data(to_delete_message_id=to_delete.message_id)
        return
    
    to_delete = await message.answer(
        text="Отправьте адрес проведения турнира",
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [tournament_add_back_button]
            ]
        )
    )
    
    await state.update_data(prize_fund=prize_fund, to_delete_message_id=to_delete.message_id)
    await state.set_state(AddTournamentState.address)
    
    
@dp.message(AddTournamentState.address)
async def add_tournament_address_handler(message: Message, state: FSMContext):
    await message.delete()
    data = await state.get_data()
    await bot.delete_message(chat_id=message.chat.id, message_id=data["to_delete_message_id"])

    
    to_delete = await message.answer(
        text="Отправьте фото, которое будет использоваться в описании турнира",
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [tournament_add_back_button]
            ]
        )
    )
    
    await state.update_data(address=message.text, to_delete_message_id=to_delete.message_id)
    await state.set_state(AddTournamentState.photo_id)
    
    
@dp.message(AddTournamentState.photo_id)
async def add_tournament_photo_id_handler(message: Message, state: FSMContext):
    await message.delete()
    data = await state.get_data()
    await bot.delete_message(chat_id=message.chat.id, message_id=data["to_delete_message_id"])
    if not message.photo:
        return await message.answer(
            text="Отправьте фото"
        )
        
    photo_id = message.photo[-1].file_id
    
    data = await state.get_data()
    sex_id = data['sex_id']

    
    tournament_category_markup = await generate_choose_category_of_tournament_markup(sex_id)
    tournament_category_markup.inline_keyboard.append(
        [tournament_add_back_button]
    )
    to_delete = await message.answer(
        text="Выберите категорию турнира:",
        reply_markup=tournament_category_markup,
    )
    
    await state.update_data(photo_id=photo_id, to_delete_message_id=to_delete.message_id)
    await state.set_state(AddTournamentState.category)
    
@dp.callback_query(lambda callback: callback.data.startswith('ccat'), AddTournamentState.category)
async def add_tournament_category_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    category_id = int(callback.data.split(':')[1])
    await callback.message.delete()
    
    to_delete = await callback.message.answer(
        text="Введите стоимость участия в турнире",
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [tournament_add_back_button]
            ]
        )
    )
    
    await state.update_data(category_id=category_id, to_delete_message_id=to_delete.message_id)
    await state.set_state(AddTournamentState.price)
    
@dp.message(AddTournamentState.price)
async def add_tournament_price_handler(message: Message, state: FSMContext):
    await message.delete()
    data = await state.get_data()
    await bot.delete_message(chat_id=message.chat.id, message_id=data["to_delete_message_id"])
    try:
        price = int(message.text)
    except ValueError:
        to_delete = await message.answer(
            text="Неверный формат стоимости. Введите ЦЕЛОЕ число.",
            reply_markup=InlineKeyboardMarkup(
                inline_keyboard=[
                    [tournament_add_back_button]
                ]
            )
        )
        await state.update_data(to_delete_message_id=to_delete.message_id)
        return
    
    
    to_delete = await message.answer(
        text="Отправьте реквизиты организатора турнира (номер карты для перечисления взноса)",
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [tournament_add_back_button]
            ]
        )
    )
    
    await state.update_data(price=price, to_delete_message_id=to_delete.message_id)
    await state.set_state(AddTournamentState.organizer_requisites)
    
@dp.message(AddTournamentState.organizer_requisites)
async def add_tournament_organizer_requisites_handler(message: Message, state: FSMContext):
    await message.delete()
    data = await state.get_data()
    await bot.delete_message(chat_id=message.chat.id, message_id=data["to_delete_message_id"])
    
    to_delete = await message.answer(
        text="Введите имя и контакты организатора турнира, например: Иванов Иван Иванович (+78005553535)",
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [tournament_add_back_button]
            ]
        )
    )
    
    await state.update_data(organizer_requisites=message.text, to_delete_message_id=to_delete.message_id)
    await state.set_state(AddTournamentState.organizer_name_and_contacts)
    
@dp.message(AddTournamentState.organizer_name_and_contacts)
async def add_tournament_organizer_name_handler(message: Message, state: FSMContext):
    await message.delete()
    data = await state.get_data()
    await bot.delete_message(chat_id=message.chat.id, message_id=data["to_delete_message_id"])
    
    to_delete = await message.answer(
        text=f"Отправьте telegram_id организатора турнира. Ваш телеграм айди - <code>{message.from_user.id}</code>",
        parse_mode='HTML',
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [tournament_add_back_button]
            ]
        )
    )
    
    await state.update_data(organizer_name_and_contacts=message.text, to_delete_message_id=to_delete.message_id)
    await state.set_state(AddTournamentState.organizer_telegram_id)
    
@dp.message(AddTournamentState.organizer_telegram_id)
async def add_tournament_organizer_telegram_id_handler(message: Message, state: FSMContext):
    await message.delete()
    data = await state.get_data()
    await bot.delete_message(chat_id=message.chat.id, message_id=data["to_delete_message_id"])
    try:
        organizer_telegram_id = int(message.text)
    except ValueError:
        to_delete = await message.answer(
            text="Неверный формат telegram_id. Введите telegram_id числом. Ваш телеграм айди - <code>{message.from_user.id}</code>",
            parse_mode='HTML',
            reply_markup=InlineKeyboardMarkup(
                inline_keyboard=[
                    [tournament_add_back_button]
                ]
            )
        )
        await state.update_data(to_delete_message_id=to_delete.message_id)
        return
        
    

    to_delete = await message.answer(
        text="Можно ли зарегистрироваться на турнир?",
        reply_markup=can_register_markup
    )
    
    await state.update_data(organizer_telegram_id=organizer_telegram_id, to_delete_message_id=to_delete.message_id)
    await state.set_state(AddTournamentState.can_register)

    
@dp.callback_query(lambda callback: callback.data.startswith('can_register'), AddTournamentState.can_register)
async def add_tournament_can_register_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    can_register = callback.data.split(':')[1]
    await state.update_data(can_register=can_register == 'yes')
    data = await state.get_data()
    
    match data["type_"]:
        case "solo":
            tournament = TournamentSolo(
                name=data["name"],
                date=data["date"],
                region=await Orm.get_region_by_id(data["region_id"]),
                price=data["price"],
                category=await Orm.get_category_by_id(data["category_id"]),
                organizer_name_and_contacts=data["organizer_name_and_contacts"],
                organizer_requisites=data["organizer_requisites"],
                sex=await Orm.get_sex_by_id(data["sex_id"]),
                address=data["address"],
                prize_fund=data["prize_fund"]
            )
            tournament_text = await generate_tournament_solo_text(tournament=tournament)
        case "duo":
            tournament = TournamentDuo(
                name=data["name"],
                date=data["date"],
                region=await Orm.get_region_by_id(data["region_id"]),
                price=data["price"],
                category=await Orm.get_category_by_id(data["category_id"]),
                organizer_name_and_contacts=data["organizer_name_and_contacts"],
                organizer_requisites=data["organizer_requisites"],
                sex=await Orm.get_sex_by_id(data["sex_id"]),
                address=data["address"],
                prize_fund=data["prize_fund"]
            )
            tournament_text = await generate_tournament_duo_text(tournament=tournament)
            
    await callback.message.answer_photo(
        photo=data["photo_id"],
        caption=tournament_text,
        reply_markup=confirm_tournament_markup
    )
    

@dp.callback_query(lambda callback: callback.data.startswith('confirm_tournament'))
async def confirm_tournament_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    data = await state.get_data()
    
    if callback.data.split(':')[1] == 'yes':
        match data["type_"]:
            case "solo":
                tournament = TournamentSolo(
                    name=data["name"],
                    photo_id=data["photo_id"],
                    date=data["date"],
                    region_id=data["region_id"],
                    price=data["price"],
                    category_id=data["category_id"],
                    organizer_name_and_contacts=data["organizer_name_and_contacts"],
                    organizer_requisites=data["organizer_requisites"],
                    organizer_telegram_id=data["organizer_telegram_id"],
                    sex_id=data["sex_id"],
                    can_register=data["can_register"],
                    address=data["address"],
                    prize_fund=data["prize_fund"]
                )
            case "duo":
                tournament = TournamentDuo(
                    name=data["name"],
                    photo_id=data["photo_id"],
                    date=data["date"],
                    region_id=data["region_id"],
                    price=data["price"],
                    category_id=data["category_id"],
                    address=data["address"],
                    organizer_name_and_contacts=data["organizer_name_and_contacts"],
                    organizer_requisites=data["organizer_requisites"],
                    organizer_telegram_id=data["organizer_telegram_id"],
                    sex_id=data["sex_id"],
                    can_register=data["can_register"],
                    prize_fund=data["prize_fund"]
                )
    else:
        await callback.message.delete()
        return await callback.message.answer(
            text="Турнир не добавлен"
        )
            
    tournament = await Orm.add_item(tournament)
    
    await callback.message.answer(
        text="Турнир успешно добавлен!"
    )
    
    await state.clear()
    
@dp.callback_query(F.data == 'back_add_tournament')
async def back_add_tournament_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    
    current_state = await state.get_state()
    data = await state.get_data()

    match current_state:
        case AddTournamentState.region:
            to_delete = await callback.message.answer(
                text="Вы уже находитесь на самом первом шаге. Нажмите 'Назад' в меню, чтобы выйти в панель администратора.",
            )
        case AddTournamentState.date:
            tournament_region_markup = await generate_choose_region_markup('crad')
            tournament_region_markup.inline_keyboard[-1] = [InlineKeyboardButton(
                text="Назад",
                callback_data="admin_panel"
            )]
            to_delete = await callback.message.answer(
                text="Выберите регион, в котором будет проходить турнир:",
                reply_markup=tournament_region_markup
            )
            await state.set_state(AddTournamentState.region)
        case AddTournamentState.type_:
            to_delete = await callback.message.answer(
                text="Введите дату начала турнира в формате ДД.ММ.ГГГГ, например: 06.05.2025",
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [tournament_add_back_button]
                    ]
                )
            )
            await state.set_state(AddTournamentState.date)
        case AddTournamentState.sex:
            tournament_type_markup = await generate_choose_type_of_tournament_markup()
            tournament_type_markup.inline_keyboard.append(
                [tournament_add_back_button]
            )
            to_delete = await callback.message.answer(
                text="Выберите тип турнира:",
                reply_markup=tournament_type_markup
            )
            await state.set_state(AddTournamentState.type_)
        case AddTournamentState.name:
            tournament_sex_markup = await generate_choose_sex_of_tournament_markup()
            tournament_sex_markup.inline_keyboard.append(
                [tournament_add_back_button]
            )
            to_delete = await callback.message.answer(
                text="Выберите пол участников турнира:",
                reply_markup=tournament_sex_markup
            )
            await state.set_state(AddTournamentState.sex)
        case AddTournamentState.prize_fund:
            to_delete = await callback.message.answer(
                text="Введите название турнира",
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [tournament_add_back_button]
                    ]
                )
            )
            await state.set_state(AddTournamentState.name)
        case AddTournamentState.address:
            to_delete = await callback.message.answer(
                text="Отправьте призовой фонд турнира. Если его нет, отправьте 0",
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [tournament_add_back_button]
                    ]
                )
            )
            await state.set_state(AddTournamentState.prize_fund)
        case AddTournamentState.photo_id:
            to_delete = await callback.message.answer(
                text="Отправьте адрес проведения турнира",
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [tournament_add_back_button]
                    ]
                )
            )
            await state.set_state(AddTournamentState.address)
        case AddTournamentState.category:
            to_delete = await callback.message.answer(
                text="Отправьте фото, которое будет использоваться в описании турнира",
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [tournament_add_back_button]
                    ]
                )
            )
            await state.set_state(AddTournamentState.photo_id)
        case AddTournamentState.price:
            sex_id = data['sex_id']
            tournament_category_markup = await generate_choose_category_of_tournament_markup(sex_id)
            tournament_category_markup.inline_keyboard.append(
                [tournament_add_back_button]
            )
            to_delete = await callback.message.answer(
                text="Выберите категорию турнира:",
                reply_markup=tournament_category_markup,
            )
            await state.set_state(AddTournamentState.category)
        case AddTournamentState.organizer_requisites:
            to_delete = await callback.message.answer(
                text="Введите стоимость участия в турнире",
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [tournament_add_back_button]
                    ]
                )
            )
            await state.set_state(AddTournamentState.price)
        case AddTournamentState.organizer_name_and_contacts:
            to_delete = await callback.message.answer(
                text="Отправьте реквизиты организатора турнира (номер карты для перечисления взноса)",
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [tournament_add_back_button]
                    ]
                )
            )
            await state.set_state(AddTournamentState.organizer_requisites)
        case AddTournamentState.organizer_telegram_id:
            to_delete = await callback.message.answer(
                text="Введите имя и контакты организатора турнира, например: Иванов Иван Иванович (+78005553535)",
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [tournament_add_back_button]
                    ]
                )
            )
            await state.set_state(AddTournamentState.organizer_name_and_contacts)
        case AddTournamentState.can_register:
            to_delete = await callback.message.answer(
                text=f"Отправьте telegram_id организатора турнира. Ваш телеграм айди - <code>{callback.from_user.id}</code>",
                parse_mode='HTML',
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [tournament_add_back_button]
                    ]
                )
            )
            await state.set_state(AddTournamentState.organizer_telegram_id)
    await state.update_data(to_delete_message_id=to_delete.message_id)
            

# ---------------------------- END OF TOURNAMENTS ----------------------------

# ---------------------------- MAIL ----------------------------

@dp.callback_query(F.data == 'do_a_mail', IsAdmin())
async def do_a_mail_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    
    await callback.message.answer(
        text="Введите текст рассылки"
    )
    
    await state.set_state(DoAMailState.text)   
    
@dp.message(DoAMailState.text)
async def do_a_mail_text_handler(message: Message, state: FSMContext):
    await state.update_data(text=message.text)
    
    await message.answer(
        text="Отправьте фото для рассылки"
    )
    
    await state.set_state(DoAMailState.photo)
    
@dp.message(DoAMailState.photo)
async def do_a_mail_photo_handler(message: Message, state: FSMContext):
    if not message.photo:
        return await message.answer(
            text="Отправьте фото"
        )
    
    photo_id = message.photo[-1].file_id
    
    await state.update_data(photo_id=photo_id)
    
    await message.answer(
        text="Введите название кнопки"
    )
    
    await state.set_state(DoAMailState.button_name)
    
@dp.message(DoAMailState.button_name)
async def do_a_mail_button_name_handler(message: Message, state: FSMContext):
    await state.update_data(button_name=message.text)
    
    await message.answer(
        text="Введите ссылку для кнопки"
    )
    
    await state.set_state(DoAMailState.button_url)
    
    
@dp.message(DoAMailState.button_url)
async def do_a_mail_button_url_handler(message: Message, state: FSMContext):
    await state.update_data(button_url=message.text)
    data = await state.get_data()
    
    await message.answer_photo(
        photo=data["photo_id"],
        caption=data["text"],
        reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(
                    text=data["button_name"],
                    url=data["button_url"]
                )]
            ]
        )
    )
    
    await message.answer(
        text="Отправить рассылку?",
        reply_markup=confirm_mail_markup
    )
    
@dp.callback_query(lambda callback: callback.data.startswith('confirm_mail'), DoAMailState.button_url)
async def confirm_mail_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    data = await state.get_data()
    
    await callback.message.answer(
        text="Отправляю рассылку..."
    )
    
    if callback.data.split(':')[1] == 'yes':
        users = await Orm.get_all_users()
        for user in users:
            try:
                await bot.send_photo(
                    chat_id=user.telegram_id,
                    photo=data["photo_id"],
                    caption=data["text"],
                    reply_markup=InlineKeyboardMarkup(
                        inline_keyboard=[
                            [InlineKeyboardButton(
                                text=data["button_name"],
                                url=data["button_url"]
                            )]
                        ]
                    )
                )
            except:
                pass
            
    await callback.message.answer(
        text="Рассылка успешно отправлена!"
    )
    
    await state.clear()
    

# ---------------------------- END OF MAIL ----------------------------    

# ---------------------------- STATISTICS ----------------------------
@dp.callback_query(F.data == "statistics", IsAdmin())
async def statistics_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    
    await send_statistics_message(callback.from_user.id)
    
async def send_statistics_message(user_id: int):
    await bot.send_message(
        chat_id=user_id,
        text=await generate_statistics_text(),
    )
    
# ---------------------------- END OF STATISTICS ----------------------------

# ---------------------------- REF STATISTICS ----------------------------
@dp.callback_query(F.data == "ref_statistics", IsAdmin())
async def ref_statistics_handler(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    await callback.message.delete()
    
    await send_ref_statistics_message(callback.from_user.id)
    
async def send_ref_statistics_message(user_id: int):
    await bot.send_message(
        chat_id=user_id,
        text=await generate_ref_statistics_text(),
    )