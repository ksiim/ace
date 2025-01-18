import datetime
from sqlalchemy import CheckConstraint, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from models.databases import Base
from sqlmodel import SQLModel


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    telegram_id: Mapped[int] = mapped_column(unique=True)
    full_name: Mapped[str]
    username: Mapped[str] = mapped_column(nullable=True)
    admin: Mapped[bool] = mapped_column(default=False)
    is_organizer: Mapped[bool] = mapped_column(default=False, nullable=True)
    end_of_subscription: Mapped[datetime.datetime] = mapped_column(nullable=True, default=None)
    start_time: Mapped[datetime.datetime] = mapped_column(nullable=True, default=datetime.datetime.now)
    from_who: Mapped[str] = mapped_column(nullable=True)
    
    region_id: Mapped[int] = mapped_column(ForeignKey('regions.id'), nullable=True)
    
    region: Mapped['Region'] = relationship('Region', back_populates='users')


class Sex(Base):
    __tablename__ = "sex"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    
    tournaments_solo: Mapped[list['TournamentSolo']] = relationship('TournamentSolo', back_populates='sex')
    tournaments_duo: Mapped[list['TournamentDuo']] = relationship('TournamentDuo', back_populates='sex')


class Region(Base):
    __tablename__ = 'regions'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    
    users: Mapped[list['User']] = relationship('User', back_populates='region')
    tournaments_solo: Mapped[list['TournamentSolo']] = relationship('TournamentSolo', back_populates='region')
    tournaments_duo: Mapped[list['TournamentDuo']] = relationship('TournamentDuo', back_populates='region')
    trainers: Mapped[list['Trainer']] = relationship('Trainer', back_populates='region')


class UserPair(Base):
    __tablename__ = 'users_pairs'

    id: Mapped[int] = mapped_column(primary_key=True)
    user1_fio: Mapped[str] = mapped_column(nullable=True)
    user2_fio: Mapped[str] = mapped_column(nullable=True)
    confirmed: Mapped[bool] = mapped_column(default=False, nullable=True)
    
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=True)
    tournament_id: Mapped[int] = mapped_column(ForeignKey('tournaments_duo.id'))
    
    user: Mapped['User'] = relationship('User', foreign_keys=[user_id], lazy='joined')
    tournament: Mapped['TournamentDuo'] = relationship('TournamentDuo', lazy='joined')



class Category(Base):
    __tablename__ = 'categories'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    child: Mapped[bool] = mapped_column(default=False, nullable=True)
    shortname: Mapped[str] = mapped_column(nullable=True)
    
    tournaments_solo: Mapped[list['TournamentSolo']] = relationship('TournamentSolo', back_populates='category')
    tournaments_duo: Mapped[list['TournamentDuo']] = relationship('TournamentDuo', back_populates='category')


class TournamentSolo(Base):
    __tablename__ = 'tournaments_solo'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    photo_id: Mapped[str] = mapped_column(nullable=True)
    organizer_name_and_contacts: Mapped[str] = mapped_column(nullable=True)
    organizer_requisites: Mapped[str] = mapped_column(nullable=True)
    organizer_telegram_id: Mapped[int] = mapped_column(nullable=True)
    date: Mapped[datetime.datetime] = mapped_column(nullable=True)
    price: Mapped[int] = mapped_column(nullable=True)
    can_register: Mapped[bool] = mapped_column(default=True)
    address: Mapped[str] = mapped_column(nullable=True)
    prize_fund: Mapped[int] = mapped_column(nullable=True)
    
    region_id: Mapped[int] = mapped_column(ForeignKey('regions.id'))
    sex_id: Mapped[int] = mapped_column(ForeignKey('sex.id'))
    category_id: Mapped[int] = mapped_column(ForeignKey('categories.id'))
    
    region: Mapped['Region'] = relationship('Region', back_populates='tournaments_solo', lazy='joined')
    sex: Mapped['Sex'] = relationship('Sex', back_populates='tournaments_solo', lazy='joined')
    category: Mapped['Category'] = relationship('Category', back_populates='tournaments_solo', lazy='joined')
    members: Mapped[list['TournamentSoloMember']] = relationship(
        'TournamentSoloMember', 
        back_populates='tournament', 
        cascade='all, delete-orphan'  # Включаем каскадное удаление
    )


class TournamentDuo(Base):
    __tablename__ = 'tournaments_duo'

    id: Mapped[int] = mapped_column(primary_key=True)
    photo_id: Mapped[str] = mapped_column(nullable=True)
    name: Mapped[str]
    organizer_name_and_contacts: Mapped[str] = mapped_column(nullable=True)
    organizer_requisites: Mapped[str] = mapped_column(nullable=True)
    organizer_telegram_id: Mapped[int] = mapped_column(nullable=True)
    date: Mapped[datetime.datetime] = mapped_column(nullable=True)
    price: Mapped[int] = mapped_column(nullable=True)
    can_register: Mapped[bool] = mapped_column(default=True)
    address: Mapped[str] = mapped_column(nullable=True)
    prize_fund: Mapped[int] = mapped_column(nullable=True)
    
    region_id: Mapped[int] = mapped_column(ForeignKey('regions.id'))
    sex_id: Mapped[int] = mapped_column(ForeignKey('sex.id'))
    category_id: Mapped[int] = mapped_column(ForeignKey('categories.id'))
    
    region: Mapped['Region'] = relationship('Region', back_populates='tournaments_duo', lazy='joined')
    sex: Mapped['Sex'] = relationship('Sex', back_populates='tournaments_duo', lazy='joined')
    category: Mapped['Category'] = relationship('Category', back_populates='tournaments_duo', lazy='joined')
    user_pairs: Mapped[list['UserPair']] = relationship(
        'UserPair', 
        back_populates='tournament', 
        cascade='all, delete-orphan'  # Включаем каскадное удаление
    )


class TournamentSoloMember(Base):
    __tablename__ = 'solo_tournament_members'

    id: Mapped[int] = mapped_column(primary_key=True)
    confirmed: Mapped[bool] = mapped_column(default=False)
    fio: Mapped[str] = mapped_column(nullable=True)
    
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    tournament_id: Mapped[int] = mapped_column(ForeignKey('tournaments_solo.id'))
    
    user: Mapped['User'] = relationship('User', lazy='joined')
    tournament: Mapped['TournamentSolo'] = relationship('TournamentSolo', lazy='joined')

class Trainer(Base):
    __tablename__ = 'trainers'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    photo: Mapped[str]
    description: Mapped[str]
    phone: Mapped[str] = mapped_column(nullable=True)
    address: Mapped[str] = mapped_column(nullable=True)
    
    region_id: Mapped[int] = mapped_column(ForeignKey('regions.id'))
    
    region: Mapped['Region'] = relationship('Region', back_populates='trainers', lazy='joined')
    

class Transaction(Base):
    
    __tablename__ = 'transactions'
    
    id: Mapped[int] = mapped_column(primary_key=True)
    amount: Mapped[int]
    payment_link: Mapped[str]
    operation_id: Mapped[str]
    months: Mapped[int]
    
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    
    user: Mapped['User'] = relationship('User', lazy='joined')
    
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
