import datetime
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder
from bot import bot
from models.dbs.models import TournamentDuo, TournamentSolo, Trainer, UserPair
from models.dbs.orm import Orm

from .callbacks import *


from config import raw_sexs, raw_regions, raw_adult_categories

choose_sex_text = f"Выберите вариант для поиска турнира"
main_menu_text = "Вы в главном меню!"
donate_text = """
<b>Дорогие друзья!</b>

Если вам нравится данный бот, и вы хотите поддержать нас, мы будем очень благодарны любой сумме. 

<code>2200701019118352</code> - Роман (Т-банк)

Также не забывайте делиться этой информацией с друзьями — это тоже большая поддержка!

Спасибо вам за вашу щедрость и доверие!

С уважением, ACE!
"""

prices = {
    '1': 199,
    '6': 1100,
    '12': 2100
}

statute_file_id = "BQACAgIAAyEFAASQpZJtAAMcZ4lyIZTXW4jrmTyVUJ9AT16Pa0AAAl5sAAL7RkhIW5Tf2e7pQXs2BA"
for_organizers_file_id = 'BQACAgIAAyEFAASQpZJtAAMbZ4lyIQRDY9JnWF3Q8QNlho4XuEgAAl1sAAL7RkhIP2xdIZJAg_A2BA'
for_clubs_file_id = 'BQACAgIAAyEFAASQpZJtAAMaZ4lyIWUh7gseghHD0X6q-5iEvWIAAlxsAAL7RkhIHuBjzvbVJe82BA'

documents_markup = InlineKeyboardMarkup(
    inline_keyboard=[
        [
            InlineKeyboardButton(
                text="Положение",
                callback_data="about_us_document"
            )
        ],
        [
            InlineKeyboardButton(
                text="Для организаторов",
                callback_data="organizer_info"
            ),
            InlineKeyboardButton(
                text="Для клубов",
                callback_data="club_info"
            )
        ]
    ]
)

about_us_text = f"""
🤖 <b>Описание бота</b>:

Наш виртуальный помощник — это интеллектуальная система, созданная для того, чтобы облегчить поиск спортивных мероприятий и сделать взаимодействие с информацией более удобной. Вам не нужно больше искать группы в каждом городе, записываться в ручную

Сократите время на поиск информации о турнирах, сосредоточившись на более важных делах.

Данный проект требует значительных финансовых вложений, и подписка помогает покрыть часть затрат для его стабильной работы. Кроме того, часть ежемесячной выручки направляется на поддержку нуждающимся юным спортсменам теннисистам.

Так же, в нашем канале каждый месяц мы проводим захватывающие розыгрыши ценных подарков теннисной тематики!🎁

Кроме того, среди наших подписчиков случайным образом выбирается талантливый юниор-теннисист, которому мы с радостью предоставляем спонсорскую помощь в виде денежных средств!

Присоединяйтесь к нам и станьте частью этой увлекательной теннисной семьи!🫶


🌟 <b>Прайс на подписку</b> 🌟

• 📅 <b>1 месяц</b>: {prices['1']} ₽

• 📅 <b>6 месяцев</b>: {prices['6']} ₽

• 📅 <b>12 месяцев</b>: {prices['12']} ₽





Электронная площадка ACE является объектом интеллектуальной собственности. Запрещается копирование, распространение или любое иное использование объектов и разработок в корыстных целях."""

buy_subscription_text = """Для новый пользователей первый месяц абсолютно бесплатно! 

При оформлении подписки Вы получаете доступ к календарю турниров, просмотру информации, участию в классификации ACE, а так же поддерживаете развитие детского тенниса. 

Выберите подходящий вариант:"""

need_to_subscribe_on_our_news_channel_text = "Для корректной работы платформы и отображения информации, подпишитесь, пожалуйста, на наш официальный канал!"
admin_panel_text = "Вы в панели администратора. Выберите действие:"
trainers_text = "Выберите тренера из вашего региона:"

trainer_back_markup = InlineKeyboardMarkup(
    inline_keyboard=[
        [
            InlineKeyboardButton(
                text="Назад",
                callback_data="back_to_trainers"
            )
        ]
    ]
)

admin_panel_markup = InlineKeyboardMarkup(
    inline_keyboard=[
        [
            InlineKeyboardButton(
                text="Добавить турнир",
                callback_data="add_tournament"
            ),
            InlineKeyboardButton(
                text="Удалить турнир",
                callback_data="delete_tournament"
            )
        ],
        [
            InlineKeyboardButton(
                text="Добавить тренера",
                callback_data="add_coach"
            ),
            InlineKeyboardButton(
                text="Удалить тренера",
                callback_data="delete_coach"
            )
        ],
        [
            InlineKeyboardButton(
                text="Сделать рассылку",
                callback_data="do_a_mail"
            )
        ],
        [
            InlineKeyboardButton(
                text="Статистика рефералов",
                callback_data="ref_statistics"
            ),
            InlineKeyboardButton(
                text="Статистика",
                callback_data="statistics"
            )
        ],
        [
            InlineKeyboardButton(
                text="Выдать\отнять права организатора",
                callback_data="change_organizer"
            )
        ]
    ]
)

subscribe_button_label = "💳 Оформить подписку"
subscription_button = KeyboardButton(
    text=subscribe_button_label)
tournament_calendar_label = "📅 Календарь турниров"
calendar_button = KeyboardButton(
    text=tournament_calendar_label)
partners_button_label = "/partners"
info_about_us_label = "ℹ️ О нас"
about_us_button = KeyboardButton(
    text=info_about_us_label)
add_tournament_label = "➕ Добавить турнир"
add_tournament_button = KeyboardButton(
    text=add_tournament_label)
my_tournaments_label = "📋 Мои турниры"
my_tournaments_button = KeyboardButton(
    text=my_tournaments_label)
trainers_label = "/trainers"

tournament_add_back_button = InlineKeyboardButton(
    text="Назад",
    callback_data="back_add_tournament"
)

partners_text = "Партнеры"

confirm_mail_markup = InlineKeyboardMarkup(
    inline_keyboard=[
        [
            InlineKeyboardButton(
                text="Подтвердить",
                callback_data="confirm_mail:yes"
            ),
            InlineKeyboardButton(
                text="Отменить",
                callback_data="confirm_mail:no"
            )
        ]
    ]
)


async def generate_statistics_text():
    return f"""
<b>Статистика:</b>

<b>Количество пользователей:</b> {await Orm.get_users_count()}
<b>Количество проведенных турниров:</b> {await Orm.get_tournaments_count()}
<b>Количество тренеров:</b> {await Orm.get_trainers_count()}
<b>Пришло вчера:</b> {await Orm.get_yesterday_count()}
<b>Пришло сегодня:</b> {await Orm.get_today_count()}
"""


async def generate_ref_statistics_text():
    referrals = await Orm.get_top_referrers()
    return f"""
<b>Статистика рефералов:</b>

{'\n'.join([f'{referral["user"].full_name} - {referral["referral_count"]}' for referral in referrals])}
"""


async def generate_back_to_tournament_markup(tournament_id, tournament_type):
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Назад",
                    callback_data=f"tournament:{
                        tournament_type}:{tournament_id}"
                )
            ]
        ]
    )


async def generate_payment_markup(payment_link, transaction_id):
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Оплатить",
                    web_app=WebAppInfo(
                        url=payment_link,
                        display_name="Оплатить"
                    )
                ),
                InlineKeyboardButton(
                    text="Я оплатил(-а)",
                    callback_data=f"check_sub_pay:{transaction_id}"
                )
            ]
        ]
    )


async def generate_buy_subcription_markup():
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"1 месяц ({prices['1']}₽)",
                    callback_data=f"buy_subscription:1"
                ),
                InlineKeyboardButton(
                    text=f"6 месяцев ({prices['6']}₽)",
                    callback_data=f"buy_subscription:6"
                ),
            ],
            [
                InlineKeyboardButton(
                    text=f"12 месяцев ({prices['12']}₽)",
                    callback_data=f"buy_subscription:12"
                )
            ]
        ]
    )


async def generate_main_menu_markup(telegram_id):
    user = await Orm.get_user_by_telegram_id(telegram_id)
    if user.is_organizer:
        return ReplyKeyboardMarkup(
            keyboard=[
                [calendar_button],
                [my_tournaments_button],
                [about_us_button],
                [add_tournament_button],
            ],
            resize_keyboard=True
        )
    else:
        return ReplyKeyboardMarkup(
            keyboard=[
                [calendar_button],
                [my_tournaments_button],
                [subscription_button],
                [about_us_button],
            ],
            resize_keyboard=True
        )


async def generate_participants_text(tournament, participants):
    if isinstance(tournament, TournamentSolo):
        return f"""<b>Участники:</b>
{'\n '.join([participant.fio if not participant.confirmed else f'✅{participant.fio}' for participant in participants])}"""
    else:
        return f"""<b>Участники:</b>
{'\n '.join([f'{participant.user1_fio}/{f"{participant.user2_fio}" if participant.user2_fio else ""}' if not participant.confirmed else f'✅{participant.user1_fio}/{f"{participant.user2_fio}" if participant.user2_fio else ""}' for participant in participants])}"""


async def generate_tournament_markup(tournament, user_id):
    tournament_type = 'solo' if isinstance(
        tournament, TournamentSolo) else 'duo'
    register_or_cancel_button = InlineKeyboardButton(
        text="Записаться",
        callback_data=f"register:{tournament.id}"
    )
    if await Orm.is_participant(tournament.id, user_id, tournament_type):
        register_or_cancel_button = InlineKeyboardButton(
            text="Отменить запись",
            callback_data=f"cancel_register:{tournament.id}"
        )
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                register_or_cancel_button,
                InlineKeyboardButton(
                    text="Список Участников",
                    callback_data=f"participants:{tournament_type}:{tournament.id}"
                )
            ],
        ]
    )
    participant = await Orm.get_tournament_participant(
        tournament.id, user_id, tournament_type)
    if isinstance(participant, UserPair):
        if participant.user2_fio is None:
            keyboard.inline_keyboard.append([InlineKeyboardButton(
                text="Добавить партнера",
                callback_data=f"partner:add:{participant.id}"
            )])
        else:
            keyboard.inline_keyboard.append([InlineKeyboardButton(
                text="Удалить партнера",
                callback_data=f"partner:del:{participant.id}"
            )])
    keyboard.inline_keyboard.append(
        [InlineKeyboardButton(
            text="Назад",
            callback_data=f"type:{tournament_type}"
        )]
    )
    return keyboard


async def generate_check_tournament_payment_markup(tournament_type_str, participant_id):
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Подтвердить",
                    callback_data=f"check_pay:{tournament_type_str}:{participant_id}"
                ),
            ]
        ]
    )


async def generate_confirm_tournament_payment_markup(tournament_type_str, participant_id):
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Подтвердить",
                    callback_data=f"conf_pay:{tournament_type_str}:{participant_id}"
                ),
            ]
        ]
    )


async def generate_tournaments_keyboard_from_list(tournaments):
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=format_tournament_info(tournament),
                    callback_data=f"tournament:{'solo' if isinstance(tournament, TournamentSolo) else 'duo'}:{tournament.id}"
                )
            ] for tournament in tournaments
        ]
    )


def format_tournament_info(tournament):
    return f'📆 {tournament.date.strftime("%d.%m")} 🎾{tournament.name[:20]}🎾 {tournament.category.shortname}'


async def generate_choose_tournament_keyboard(type_, region_id, sex_id):
    sex = await Orm.get_sex_by_id(sex_id)
    match type_:
        case 'solo':
            tournaments = await Orm.get_solo_tournaments_by_region_and_sex_name(region_id, sex.name)
        case 'duo':
            tournaments = await Orm.get_duo_tournaments_by_region_and_sex_name(region_id, sex.name)
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=format_tournament_info(tournament),
                    callback_data=f"tournament:{'solo' if isinstance(tournament, TournamentSolo) else 'duo'}:{tournament.id}"
                )
            ] for tournament in tournaments
        ] + [[InlineKeyboardButton(
            text="Назад",
            callback_data="back_to_sex"
        )]]
    )


async def generate_delete_tournament_markup(tournaments):
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f'{tournament.name} {
                        tournament.date.strftime("%d.%m.%Y")}',
                    callback_data=f"delete_tour:{tournament.id}"
                )
            ] for tournament in tournaments
        ]
    )


async def generate_choose_type_of_delete_tournament_markup():
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Одиночный",
                    callback_data="deltourtype:solo"
                ),
                InlineKeyboardButton(
                    text="Парный",
                    callback_data="deltourtype:duo"
                )
            ]
        ]
    )


async def generate_choose_sex_to_delete_tournament_markup():
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=sex.name,
                    callback_data=f"delsextour:{sex.id}"
                )
            ] for sex in await Orm.get_all_sexs()
        ]
    )


async def generate_choose_tournament_to_delete_markup(region_id, sex_id, type_):
    match type_:
        case 'solo':
            tournaments = await Orm.get_solo_tournaments_by_region_and_sex_id(region_id, sex_id)
        case 'duo':
            tournaments = await Orm.get_duo_tournaments_by_region_and_sex_id(region_id, sex_id)
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f'{tournament.name} {
                        tournament.date.strftime("%d.%m.%Y")}',
                    callback_data=f"del_tour:{tournament.id}"
                )
            ] for tournament in tournaments
        ]
    )

confirm_delete_tournament_markup = InlineKeyboardMarkup(
    inline_keyboard=[
        [
            InlineKeyboardButton(
                text="Подтвердить",
                callback_data="conf_del_tour:yes"
            ),
            InlineKeyboardButton(
                text="Отменить",
                callback_data="conf_del_tour:no"
            )
        ]
    ]
)


async def generate_start_text(message):
    return f'Привет, {message.from_user.full_name}! Я - бот. Прежде чем начать, выбери регион, в котором ты находишься.'


async def generate_tournament_text(tournament):
    if isinstance(tournament, TournamentSolo):
        return await generate_tournament_solo_text(tournament)
    else:
        return await generate_tournament_duo_text(tournament)


async def generate_tournament_solo_text(tournament: TournamentSolo):
    return f"""
{tournament.region.name}
{tournament.date.strftime("%d.%m.%Y")}
Место проведения: {tournament.address}
Одиночный {tournament.sex.name.lower()} турнир

{tournament.name}
{tournament.category.name}{f'\Призовой фонд {tournament.prize_fund}₽' if tournament.prize_fund else ''}
Взнос {tournament.price}₽

Главный судья {tournament.organizer_name_and_contacts}

Статус: {await generate_tournament_status(tournament)}
"""


async def generate_tournament_status(tournament):
    date = tournament.date
    now = datetime.datetime.now()
    days_left = (date - now).days

    if days_left > 14:
        return "ожидание регистрации"
    elif days_left > 4:
        return "подача заявок"
    else:
        return "подтверждение заявок"


async def generate_tournament_duo_text(tournament: TournamentDuo):
    return f"""
{tournament.region.name}
{tournament.date.strftime("%d.%m.%Y")}
Место проведения: {tournament.address}
Парный {tournament.sex.name.lower()} турнир

{tournament.name}
{tournament.category.name}{f'\Призовой фонд {tournament.prize_fund}₽' if tournament.prize_fund else ''}
Взнос {tournament.price}₽

Главный судья {tournament.organizer_name_and_contacts}

Статус: {await generate_tournament_status(tournament)}
"""

confirm_tournament_markup = InlineKeyboardMarkup(
    inline_keyboard=[
        [
            InlineKeyboardButton(
                text="Подтвердить",
                callback_data="confirm_tournament:yes"
            ),
            InlineKeyboardButton(
                text="Отменить",
                callback_data="confirm_tournament:no"
            )
        ]
    ]
)


async def generate_choose_region_markup(subtext):
    regions = await Orm.get_all_regions()
    markup = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text=f"{region.name} ({await Orm.get_count_of_tournaments_by_region_id(region.id) if subtext in ['see_tournaments', 'del_tour_region', 'crad'] else await Orm.get_count_of_trainers_by_region_id(region.id)})",
                callback_data=f"{subtext}:{region.id}"
            )] for region in regions
        ] + [[
            InlineKeyboardButton(
                text="Назад",
                callback_data="main_menu"
            )
        ]]
    )
    return markup


async def generate_choose_sex_keyboard(from_where: str, region_id: int):
    sexs = await Orm.get_all_sexs()
    markup = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"{sex.name} ({await Orm.get_count_of_tournaments_by_region_and_sex_id(region_id, sex.id)})",
                    callback_data=f'sex:{sex.id}'
                )
            ] for sex in sexs if sex.name != raw_sexs[3]
        ] + [[InlineKeyboardButton(
            text="Назад",
            callback_data=f"back_to_regions:{from_where}"
        )]]
    )
    return markup


async def generate_change_region_text(telegram_id):
    user = await Orm.get_user_by_telegram_id(telegram_id)
    return f"Текущий регион: {user.region.name}. Выберите новый регион:"


async def generate_trainer_text(trainer: Trainer):
    return f"""
<b>Имя:</b> {trainer.name}
<b>Регион:</b> {trainer.region.name}
<b>Описание:</b> {trainer.description}
<b>Телефон:</b> {trainer.phone}
<b>Адрес работы:</b> {trainer.address}
"""

confirm_add_trainer_markup = InlineKeyboardMarkup(
    inline_keyboard=[
        [
            InlineKeyboardButton(
                text="Подтвердить",
                callback_data="confirm_add_trainer:yes"
            ),
            InlineKeyboardButton(
                text="Отменить",
                callback_data="confirm_add_trainer:no"
            )
        ]
    ]
)

confirm_delete_trainer_markup = InlineKeyboardMarkup(
    inline_keyboard=[
        [
            InlineKeyboardButton(
                text="Подтвердить",
                callback_data="confirm_delete_trainer:yes"
            ),
            InlineKeyboardButton(
                text="Отменить",
                callback_data="confirm_delete_trainer:no"
            )
        ]
    ]
)


async def generate_trainers_markup(trainers: list[Trainer], subtext="trainer", from_where="see_coaches"):
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=trainer.name,
                    callback_data=f"{subtext}:{trainer.id}"
                )
            ] for trainer in trainers
        ] + [[
            InlineKeyboardButton(
                text="Назад",
                callback_data=f"back_to_regions:{from_where}"
            )
        ]]
    )


async def generate_channel_markup():
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text="Подписаться",
                url="https://t.me/Ace_news_channel"
            )],
            [InlineKeyboardButton(
                text="Я подписался(-ась)",
                callback_data="check_channel"
            )]
        ]
    )


async def generate_choose_tournament_type_keyboard(sex_id, region_id):
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"Одиночный ({await Orm.get_count_of_types_tournaments_by_region_and_sex_id(TournamentSolo, region_id, sex_id)})",
                    callback_data="type:solo"
                ),
                InlineKeyboardButton(
                    text=f"Парный ({await Orm.get_count_of_types_tournaments_by_region_and_sex_id(TournamentDuo, region_id, sex_id)})",
                    callback_data="type:duo"
                )
            ],
            [InlineKeyboardButton(
                text="Назад",
                callback_data="calendar_of_tournaments"
            )]
        ]
    )


async def generate_choose_type_of_tournament_markup():
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Одиночный",
                    callback_data="att:solo"
                ),
                InlineKeyboardButton(
                    text="Парный",
                    callback_data="att:duo"
                )
            ]
        ]
    )


async def generate_choose_category_of_tournament_markup(sex_id):
    sex = await Orm.get_sex_by_id(sex_id)
    if sex.name == raw_sexs[2]:
        categories = await Orm.get_child_categories()
    else:
        categories = await Orm.get_adult_categories()
    markup = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text=category.name,
                callback_data=f"ccat:{category.id}"
            )] for category in categories
        ]
    )
    return markup


async def generate_choose_sex_of_tournament_markup():
    sexs = await Orm.get_all_sexs()
    markup = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text=sex.name,
                callback_data=f'csot:{sex.id}'
            )] for sex in sexs
        ]
    )
    return markup

can_register_markup = InlineKeyboardMarkup(
    inline_keyboard=[
        [
            InlineKeyboardButton(
                text="Да",
                callback_data="can_register:yes"
            ),
            InlineKeyboardButton(
                text="Нет",
                callback_data="can_register:no"
            )
        ],
        [
            tournament_add_back_button
        ]
    ]
)
