from pydantic import EmailStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    API_V1_STR: str
    GATEWAY_TOKEN: str
    JWT_TOKEN: str
    CUSTOMER_CODE: str
    MERCHANT_ID: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    EMAIL_RESET_TOKEN_EXPIRE_HOURS: int
    EMAILS_FROM_EMAIL: EmailStr
    EMAILS_FROM_NAME: str
    SMTP_HOST: str
    SMTP_PORT: int
    SMTP_USER: str
    SMTP_PASSWORD: str
    SUPERUSER_EMAIL: EmailStr
    SUPERUSER_PASSWORD: str
    PROJECT_NAME: str
    FRONTEND_HOST: str

settings = Settings()
