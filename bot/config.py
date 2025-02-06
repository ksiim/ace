from dotenv import load_dotenv
import os

load_dotenv()  # Загрузка переменных из .env файла

BOT_TOKEN = os.getenv('BOT_TOKEN')
CHANNEL_ID = os.getenv('CHANNEL_ID')
JWT_TOKEN = os.getenv('JWT_TOKEN')
CUSTOMER_CODE = os.getenv('CUSTOMER_CODE')
MERCHANT_ID = os.getenv('MERCHANT_ID')

raw_regions = [
    'Московская область',
    'Ростовская область',
    'Краснодарский край',
    'Ставропольский край',
    'Воронежская область',
    'Волгоградская область ',
    'Санкт-Петербург',
    'Астраханская область',
    'Самарская область',
    'Саратовская область',
    'Красноярский край',
    'Брянская область',
    'Нижегородская область',
    'Республика Татарстан'
]

raw_sexs = [
    'Мужской',
    'Женский',
    'Детский',
    "Микст"
]

raw_adult_categories = [
    "Pro-Am",
    "1 категория",
    "2 категория",
    "3 категория",
]

raw_child_categories = [
    "Red ball",
    "Orange ball",
    "Green ball",
]
