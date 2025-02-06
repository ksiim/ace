from dotenv import load_dotenv
import os

load_dotenv()


API_V1_STR = os.getenv('API_V1_STR')
JWT_TOKEN = os.getenv('JWT_TOKEN')
CUSTOMER_CODE = os.getenv('CUSTOMER_CODE')
MERCHANT_ID = os.getenv('MERCHANT_ID')