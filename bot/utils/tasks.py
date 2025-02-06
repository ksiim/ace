import datetime
from handlers.markups import generate_check_tournament_payment_markup
from common.db.models import TournamentDuo, TournamentSolo
from common.db.orm import Orm

from bot import bot


async def mail_four_days_before_tournament():
    solo_tournaments = await Orm.get_all_current_solo_tournaments()
    duo_tournaments = await Orm.get_all_current_duo_tournaments()

    now = datetime.datetime.now()
    for solo_tournament in solo_tournaments:
        days_until_tournament = solo_tournament.date.date() - now.date()
        if days_until_tournament == datetime.timedelta(days=4):
            participants = await Orm.get_tournament_participants(solo_tournament.id, TournamentSolo)
            for participant in participants:
                if not participant.confirmed:
                    await bot.send_message(
                        chat_id=participant.user.telegram_id,
                        text=f'''Через 4 дня начнется турнир {solo_tournament.name}.
Пожалуйста, подтвердите свое участие.

Реквизиты организатора:
{participant.tournament.organizer_name_and_contacts}
Размер взноса: {participant.tournament.price}₽''',
                        reply_markup=await generate_check_tournament_payment_markup('solo', participant.id)
                    )
    for duo_tournament in duo_tournaments:
        days_until_tournament = duo_tournament.date.date() - now.date()
        if days_until_tournament == datetime.timedelta(days=4):
            participants = await Orm.get_tournament_participants(duo_tournament.id, TournamentDuo)
            for participant in participants:
                if not participant.confirmed:
                    await bot.send_message(
                        chat_id=participant.user.telegram_id,
                        text=f'''Через 4 дня начнется турнир {duo_tournament.name}.
Пожалуйста, подтвердите свое участие.

Реквизиты организатора:
{participant.tournament.organizer_name_and_contacts}
Размер взноса: {participant.tournament.price}₽

Вы должны оплатить взнос за обоих участников команды ({participant.tournament.price}₽)''',
                        reply_markup=await generate_check_tournament_payment_markup('duo', participant.id)
                    )

async def check_last_tournaments():
    organizers = await Orm.get_all_organizers()
    now = datetime.datetime.now()
    
    for organizer in organizers:
        last_tournament = await Orm.last_tournament_by_organizer_id(organizer.telegram_id)
        if now - last_tournament.date > datetime.timedelta(days=30):
            await Orm.change_organizer_status(organizer.telegram_id, False)