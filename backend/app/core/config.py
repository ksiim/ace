from dotenv import load_dotenv
import os

load_dotenv()


API_V1_STR = os.getenv('API_V1_STR')

GATEWAY_TOKEN = os.getenv('GATEWAY_TOKEN')

JWT_TOKEN = os.getenv('JWT_TOKEN')
CUSTOMER_CODE = os.getenv('CUSTOMER_CODE')
MERCHANT_ID = os.getenv('MERCHANT_ID')

SECRET_KEY = os.getenv('SECRET_KEY')
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv('ACCESS_TOKEN_EXPIRE_MINUTES'))
EMAIL_RESET_TOKEN_EXPIRE_HOURS = int(os.getenv('EMAIL_RESET_TOKEN_EXPIRE_HOURS'))

EMAILS_FROM_EMAIL = os.getenv('EMAILS_FROM_EMAIL')
EMAILS_FROM_NAME = os.getenv('EMAILS_FROM_NAME')
SMTP_HOST = os.getenv('SMTP_HOST')
SMTP_PORT = os.getenv('SMTP_PORT')
SMTP_USER = os.getenv('SMTP_USER')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')

SUPERUSER_EMAIL = os.getenv('SUPERUSER_EMAIL')
SUPERUSER_PASSWORD = os.getenv('SUPERUSER_PASSWORD')

PROJECT_NAME = os.getenv('PROJECT_NAME')

FRONTEND_HOST = os.getenv('FRONTEND_HOST')
