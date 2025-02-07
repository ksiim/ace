from dotenv import load_dotenv
import os

load_dotenv()  # Загрузка переменных из .env файла

BOT_TOKEN = os.getenv('BOT_TOKEN')
CHANNEL_ID = os.getenv('CHANNEL_ID')
JWT_TOKEN = os.getenv('JWT_TOKEN')
CUSTOMER_CODE = os.getenv('CUSTOMER_CODE')
MERCHANT_ID = os.getenv('MERCHANT_ID')
