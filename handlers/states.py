from aiogram.fsm.state import State, StatesGroup


class AddTournamentState(StatesGroup):
    name = State()
    region = State()
    type_ = State()
    date = State()
    price = State()
    photo_id = State()
    category = State()
    organizer_name_and_contacts = State()
    organizer_requisites = State()
    organizer_telegram_id = State()
    can_register = State()
    sex = State()
    address = State()
    prize_fund = State()
    
    

class AddCoachState(StatesGroup):
    region = State()
    name = State()
    description = State()
    photo = State()
    phone = State()
    address = State()
    
class DoAMailState(StatesGroup):
    text = State()
    photo = State()
    button_name = State()
    button_url = State()
    
    
class RegisterOnTournamentState(StatesGroup):
    fio = State()
    age = State()
    fio_duo = State()