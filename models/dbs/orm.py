import asyncio

from models.databases import Session
from models.dbs.models import *

from sqlalchemy import desc, func, insert, inspect, or_, select, text, update
import datetime
from sqlalchemy.orm import joinedload

from config import raw_regions, raw_sexs, raw_adult_categories


class Orm:
    
    @staticmethod
    async def get_duo_tournaments_by_region_and_sex_id(region_id, sex_id):
        async with Session() as session:
            query = (
                select(TournamentDuo)
                .where(TournamentDuo.region_id == region_id)
                .where(TournamentDuo.sex_id == sex_id)
                .where(func.date(TournamentDuo.date) >= datetime.datetime.now().date() - datetime.timedelta(days=2))
                .options(
                    joinedload(TournamentDuo.region),
                    joinedload(TournamentDuo.category)
                )
            )
            tournaments = (await session.execute(query)).scalars().all()
            return tournaments
    
    @staticmethod
    async def last_tournament_by_organizer_id(organizer_telegram_id):
        async with Session() as session:
            query = (
                select(TournamentSolo)
                .where(TournamentSolo.organizer_telegram_id == organizer_telegram_id)
                .order_by(desc(TournamentSolo.date))
            )
            solo_tournament = (await session.execute(query)).scalar_one_or_none()
            query = (
                select(TournamentDuo)
                .where(TournamentDuo.organizer_telegram_id == organizer_telegram_id)
                .order_by(desc(TournamentDuo.date))
            )
            duo_tournament = (await session.execute(query)).scalar_one_or_none()
            if solo_tournament.date > duo_tournament.date:
                return solo_tournament
            return duo_tournament
    
    @staticmethod
    async def get_all_organizers():
        async with Session() as session:
            query = select(User).where(User.is_organizer == True)
            organizers = (await session.execute(query)).scalars().all()
            return organizers
    
    @staticmethod
    async def change_organizer_status(telegram_id, status: bool):
        async with Session() as session:
            query = update(User).where(User.telegram_id == telegram_id).values(is_organizer=status)
            await session.execute(query)
            await session.commit()
    
    @staticmethod
    async def get_count_of_types_tournaments_by_region_and_sex_id(tournament_type, region_id, sex_id):
        async with Session() as session:
            query = (
                select(func.count(tournament_type.id))
                .where(tournament_type.region_id == region_id)
                .where(tournament_type.sex_id == sex_id)
                .where(func.date(tournament_type.date) >= datetime.datetime.now().date() - datetime.timedelta(days=2))
            )
            tournaments_count = (await session.execute(query)).scalar()
            return tournaments_count
    
    @staticmethod
    async def get_count_of_tournaments_by_region_and_sex_id(region_id, sex_id):
        async with Session() as session:
            query = (
                select(func.count(TournamentSolo.id))
                .where(TournamentSolo.region_id == region_id)
                .where(TournamentSolo.sex_id == sex_id)
                .where(func.date(TournamentSolo.date) >= datetime.datetime.now().date() - datetime.timedelta(days=2))
            )
            solo_tournaments_count = (await session.execute(query)).scalar()
            query = (
                select(func.count(TournamentDuo.id))
                .where(TournamentDuo.region_id == region_id)
                .where(TournamentDuo.sex_id == sex_id)
                .where(func.date(TournamentDuo.date) >= datetime.datetime.now().date() - datetime.timedelta(days=2))
            )
            duo_tournaments_count = (await session.execute(query)).scalar()
            return solo_tournaments_count + duo_tournaments_count
    
    @staticmethod
    async def get_count_of_trainers_by_region_id(region_id):
        async with Session() as session:
            query = select(func.count(Trainer.id)).where(Trainer.region_id == region_id)
            trainers_count = (await session.execute(query)).scalar()
            return trainers_count
    
    @staticmethod
    async def update_user_subscription(user_id, months):
        async with Session() as session:
            user = await session.get(User, user_id)
            if user.end_of_subscription is None:
                user.end_of_subscription = datetime.datetime.now()

            new_end_date = user.end_of_subscription + datetime.timedelta(days=30 * months)
            query = (
                update(User)
                .where(User.id == user_id)
                .values(end_of_subscription=new_end_date)
            )
            await session.execute(query)
            await session.commit()
    
    @staticmethod
    async def get_transaction_by_id(transaction_id):
        async with Session() as session:
            query = select(Transaction).where(Transaction.id == transaction_id)
            transaction = (await session.execute(query)).scalar_one_or_none()
            return transaction
    
    @staticmethod
    async def is_subscribed(telegram_id):
        async with Session() as session:
            query = select(User).where(User.telegram_id == telegram_id)
            user = (await session.execute(query)).scalar_one_or_none()
            if user.end_of_subscription:
                return user.end_of_subscription > datetime.datetime.now()
            return (user.end_of_subscription is not None and user.end_of_subscription > datetime.datetime.now()) or user.start_time > datetime.datetime.now() - datetime.timedelta(days=60)
    
    @staticmethod
    async def get_count_of_tournaments_by_region_id(region_id):
        async with Session() as session:
            query = (
                select(func.count(TournamentSolo.id))
                .where(TournamentSolo.region_id == region_id)
                .where(func.date(TournamentSolo.date) >= datetime.datetime.now().date() - datetime.timedelta(days=2))
            )
            solo_tournaments_count = (await session.execute(query)).scalar()
            query = (
                select(func.count(TournamentDuo.id))
                .where(TournamentDuo.region_id == region_id)
                .where(func.date(TournamentDuo.date) >= datetime.datetime.now().date() - datetime.timedelta(days=2))
            )
            duo_tournaments_count = (await session.execute(query)).scalar()
            return solo_tournaments_count + duo_tournaments_count
    
    @staticmethod
    async def get_top_referrers():
        async with Session() as session:
            subquery = (
                select(
                    User.from_who,
                    func.count(User.id).label('referral_count')
                )
                .where(User.from_who.isnot(None))
                .where(User.end_of_subscription != None)
                .where(User.end_of_subscription > datetime.datetime.now())
                .where(User.start_time > datetime.datetime.now() - datetime.timedelta(days=30))
                .group_by(User.from_who)
                .subquery()
            )

            query = (
                select(User, subquery.c.referral_count)
                .join(subquery, User.telegram_id == subquery.c.from_who)
                .order_by(desc(subquery.c.referral_count))
            )

            result = await session.execute(query)
            top_referrers = result.all()

            return [{"user": user, "referral_count": referral_count} for user, referral_count in top_referrers]
    
    @staticmethod
    async def get_today_count():
        async with Session() as session:
            today = datetime.datetime.now().replace(hour=0, minute=0, second=0)
            query = select(func.count(User.id)).where(User.start_time >= today)
            return (await session.execute(query)).scalar()
    
    @staticmethod
    async def get_yesterday_count():
        async with Session() as session:
            one_day_ago = datetime.datetime.now().replace(hour=0, minute=0, second=0) - datetime.timedelta(days=1)
            today = datetime.datetime.now().replace(hour=0, minute=0, second=0)
            query = select(func.count(User.id)).where(User.start_time.between(one_day_ago, today))
            return (await session.execute(query)).scalar()
    
    @staticmethod
    async def get_trainers_count():
        async with Session() as session:
            query = select(func.count(Trainer.id))
            trainers_count = (await session.execute(query)).scalar()
            return trainers_count
    
    @staticmethod
    async def get_tournaments_count():
        async with Session() as session:
            query = select(func.count(TournamentSolo.id))
            solo_tournaments_count = (await session.execute(query)).scalar()
            query = select(func.count(TournamentDuo.id))
            duo_tournaments_count = (await session.execute(query)).scalar()
            return solo_tournaments_count + duo_tournaments_count
    
    @staticmethod
    async def get_users_count():
        async with Session() as session:
            query = select(func.count(User.id))
            users_count = (await session.execute(query)).scalar()
            return users_count
    
    @staticmethod
    async def get_user_duo_tournaments(user_id):
        async with Session() as session:
            query = (
                select(UserPair)
                .where(UserPair.user_id == user_id)
                .options(
                    joinedload(UserPair.tournament)
                )
            )
            user_pairs = (await session.execute(query)).scalars().all()
            tournaments = [user_pair.tournament for user_pair in user_pairs]
            return tournaments
    
    @staticmethod
    async def get_user_solo_tournaments(user_id):
        async with Session() as session:
            query = (
                select(TournamentSoloMember)
                .where(TournamentSoloMember.user_id == user_id)
                .join(TournamentSolo)
                .options(
                    joinedload(TournamentSoloMember.tournament)
                )
            )
            tournament_members = (await session.execute(query)).scalars().all()
            tournaments = [member.tournament for member in tournament_members]
            return tournaments
    
    @staticmethod
    async def get_user_tournaments(user_id):
        async with Session() as session:
            solo_tournaments = await Orm.get_user_solo_tournaments(user_id)
            duo_tournaments = await Orm.get_user_duo_tournaments(user_id)
            return solo_tournaments + duo_tournaments
    
    @staticmethod
    async def confirm_payment(participant_id, tournament_type):
        async with Session() as session:
            if tournament_type == 'solo':
                query = update(TournamentSoloMember).where(
                    TournamentSoloMember.id == participant_id).values(confirmed=True)
            else:
                query = update(UserPair).where(
                    UserPair.id == participant_id).values(confirmed=True)
            await session.execute(query)
            await session.commit()
    
    @staticmethod
    async def get_tournament_participant_by_id(participant_id, tournament_type):
        async with Session() as session:
            if tournament_type == 'solo':
                query = (
                    select(TournamentSoloMember)
                    .where(TournamentSoloMember.id == participant_id)
                    .options(
                        joinedload(TournamentSoloMember.tournament),
                        joinedload(TournamentSoloMember.user)
                    )
                )
            else:
                query = (
                    select(UserPair)
                    .where(UserPair.id == participant_id)
                    .options(
                        joinedload(UserPair.tournament),
                        joinedload(UserPair.user)
                    )
                )
            participant = (await session.execute(query)).scalar_one_or_none()
            return participant

    @staticmethod
    async def get_all_current_duo_tournaments():
        async with Session() as session:
            query = (
                select(TournamentDuo)
                .where(TournamentDuo.date > datetime.datetime.now())
                .where(TournamentDuo.can_register == True)
            )
            tournaments = (await session.execute(query)).scalars().all()
            return tournaments

    @staticmethod
    async def get_all_current_solo_tournaments():
        async with Session() as session:
            query = (
                select(TournamentSolo)
                .where(TournamentSolo.date > datetime.datetime.now())
                .where(TournamentSolo.can_register == True)
            )
            tournaments = (await session.execute(query)).scalars().all()
            return tournaments

    @staticmethod
    async def add_user2_fio(user_pair_id, fio):
        async with Session() as session:
            query = update(UserPair).where(
                UserPair.id == user_pair_id).values(user2_fio=fio)
            await session.execute(query)
            await session.commit()

    @staticmethod
    async def delete_user2_fio(user_pair_id):
        async with Session() as session:
            query = update(UserPair).where(
                UserPair.id == user_pair_id).values(user2_fio=None)
            await session.execute(query)
            await session.commit()

    @staticmethod
    async def get_solo_tournaments_by_region_and_sex_id(region_id, sex_id):
        async with Session() as session:
            query = (
                select(TournamentSolo)
                .where(TournamentSolo.region_id == region_id)
                .where(TournamentSolo.sex_id == sex_id)
                .where(func.date(TournamentSolo.date) >= datetime.datetime.now().date() - datetime.timedelta(days=2))
                .options(
                    joinedload(TournamentSolo.region),
                    joinedload(TournamentSolo.category)
                )
            )
            tournaments = (await session.execute(query)).scalars().all()
            return tournaments

    @staticmethod
    async def create_child_category(name):
        async with Session() as session:
            category = Category(name=name, child=True)
            session.add(category)
            await session.commit()

    @staticmethod
    async def get_child_categories():
        async with Session() as session:
            query = select(Category).where(Category.child == True)
            child_categories = (await session.execute(query)).scalars().all()
            return child_categories

    @staticmethod
    async def get_tournament_participant(tournament_id, user_id, tournament_type):
        async with Session() as session:
            if tournament_type == 'solo':
                query = (
                    select(TournamentSoloMember)
                    .where(TournamentSoloMember.tournament_id == tournament_id)
                    .where(TournamentSoloMember.user_id == user_id)
                    .options(
                        joinedload(TournamentSoloMember.tournament)
                    )
                )
            else:
                query = (
                    select(UserPair)
                    .where(UserPair.tournament_id == tournament_id)
                    .where(UserPair.user_id == user_id)
                    .options(
                        joinedload(UserPair.tournament)
                    )
                )
            participant = (await session.execute(query)).scalar_one_or_none()
            return participant

    @staticmethod
    async def is_participant(tournament_id, user_id, tournament_type):
        async with Session() as session:
            if tournament_type == 'solo':
                query = (
                    select(TournamentSoloMember)
                    .where(TournamentSoloMember.tournament_id == tournament_id)
                    .where(TournamentSoloMember.user_id == user_id)
                )
            else:
                query = (
                    select(UserPair)
                    .where(UserPair.tournament_id == tournament_id)
                    .where(UserPair.user_id == user_id)
                )
            participant = (await session.execute(query)).scalar_one_or_none()
            return participant is not None

    @staticmethod
    async def get_tournament_participants(tournament_id, tournament_type):
        async with Session() as session:
            if tournament_type == TournamentSolo:
                query = (
                    select(TournamentSoloMember)
                    .where(TournamentSolo.id == tournament_id)
                    .join(User)
                    .join(TournamentSolo)
                    .options(
                        joinedload(TournamentSoloMember.tournament),
                        joinedload(TournamentSoloMember.user)
                    )
                )
            else:
                query = (
                    select(UserPair)
                    .where(UserPair.tournament_id == tournament_id)
                    .join(User)
                    .join(TournamentDuo)
                    .options(
                        joinedload(UserPair.tournament),
                        joinedload(UserPair.user)
                    )
                )
            participants = (await session.execute(query)).scalars().all()
            return participants

    @staticmethod
    async def delete_item(item):
        async with Session() as session:
            await session.delete(item)
            await session.commit()

    @staticmethod
    async def get_tournament_by_id(tournament_id, tournament_type):
        async with Session() as session:
            query = (
                select(tournament_type)
                .where(tournament_type.id == tournament_id)
                .options(
                    joinedload(tournament_type.region),
                    joinedload(tournament_type.sex),
                    joinedload(tournament_type.category)
                )
            )
            tournament = await session.execute(query)
            tournament = tournament.scalar_one_or_none()
            return tournament

    @staticmethod
    async def get_duo_tournaments_by_region_and_sex_name(region_id, sex_name):
        async with Session() as session:
            query = (
                select(TournamentDuo)
                .join(Sex)
                .where(TournamentDuo.region_id == region_id)
                .where(Sex.name.in_([sex_name, raw_sexs[3]]))
                .where(func.date(TournamentDuo.date) >= datetime.datetime.now().date() - datetime.timedelta(days=2))
                .options(
                    joinedload(TournamentDuo.region),
                    joinedload(TournamentDuo.category)
                )
            )
            tournaments = (await session.execute(query)).scalars().all()
            return tournaments

    @staticmethod
    async def get_solo_tournaments_by_region_and_sex_name(region_id, sex_name):
        async with Session() as session:
            query = (
                select(TournamentSolo)
                .join(Sex)
                .where(TournamentSolo.region_id == region_id)
                .where(Sex.name == sex_name)
                .where(func.date(TournamentSolo.date) >= datetime.datetime.now().date() - datetime.timedelta(days=2))
                .options(
                    joinedload(TournamentSolo.region),
                    joinedload(TournamentSolo.category)
                )
            )
            tournaments = (await session.execute(query)).scalars().all()
            return tournaments

    @staticmethod
    async def get_trainer_by_id(trainer_id):
        async with Session() as session:
            query = select(Trainer).where(Trainer.id == trainer_id).options(
                joinedload(Trainer.region))
            trainer = await session.execute(query)
            trainer = trainer.scalar_one_or_none()
            return trainer

    @staticmethod
    async def get_trainers_with_region_id(region_id):
        async with Session() as session:
            query = select(Trainer).where(Trainer.region_id == region_id)
            trainers = (await session.execute(query)).scalars().all()
            return trainers

    @staticmethod
    async def get_category_by_id(category_id):
        async with Session() as session:
            category = await session.get(Category, category_id)
            return category

    @staticmethod
    async def create_adult_category(name):
        async with Session() as session:
            category = Category(name=name)
            session.add(category)
            await session.commit()

    @staticmethod
    async def add_item(item):
        async with Session() as session:
            session.add(item)
            await session.commit()
            await session.refresh(item)
            return item

    @staticmethod
    async def get_adult_categories():
        async with Session() as session:
            query = select(Category).where(Category.child == False)
            categories = (await session.execute(query)).scalars().all()
            return categories

    @staticmethod
    async def get_admins_ids():
        async with Session() as session:
            query = select(User.telegram_id).where(User.admin == True)
            admins = (await session.execute(query)).scalars().all()
            return admins

    @staticmethod
    async def get_sex_by_id(sex_id):
        async with Session() as session:
            sex = await session.get(Sex, sex_id)
            return sex

    @staticmethod
    async def create_sex(name):
        async with Session() as session:
            sex = Sex(name=name)
            session.add(sex)
            await session.commit()

    @staticmethod
    async def create_region(region_name):
        async with Session() as session:
            region = Region(name=region_name)
            session.add(region)
            await session.commit()

    @staticmethod
    async def get_region_by_id(region_id):
        async with Session() as session:
            query = select(Region).where(Region.id == region_id)
            region = (await session.execute(query)).scalar_one_or_none()
            return region

    @staticmethod
    async def update_user_region(telegram_id, region_id):
        async with Session() as session:
            query = update(User).where(User.telegram_id ==
                                       telegram_id).values(region_id=region_id)
            await session.execute(query)
            await session.commit()

    @staticmethod
    async def get_all_sexs():
        async with Session() as session:
            query = select(Sex)
            sexs = (await session.execute(query)).scalars().all()
            return sexs

    @staticmethod
    async def get_all_regions():
        async with Session() as session:
            query = select(Region).order_by(Region.name)
            regions = (await session.execute(query)).scalars().all()
            return regions

    @staticmethod
    async def create_user(message, from_who):
        if await Orm.get_user_by_telegram_id(message.from_user.id) is None:
            async with Session() as session:
                user = User(
                    full_name=message.from_user.full_name,
                    telegram_id=message.from_user.id,
                    username=message.from_user.username,
                    from_who=from_who
                )
                session.add(user)
                await session.commit()

    @staticmethod
    async def get_user_by_telegram_id(telegram_id):
        async with Session() as session:
            query = select(User).where(User.telegram_id == telegram_id).options(joinedload(User.region))
            user = (await session.execute(query)).scalar_one_or_none()
            return user

    @staticmethod
    async def get_all_users():
        async with Session() as session:
            query = select(User)
            users = (await session.execute(query)).scalars().all()
            return users
