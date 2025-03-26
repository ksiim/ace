from pydantic import EmailStr, computed_field
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
    CLIENT_ID: str
    PUBLIC_KEY: dict = {
        "kty": "RSA",
        "e": "AQAB",
        "n": "rwm77av7GIttq-JF1itEgLCGEZW_zz16RlUQVYlLbJtyRSu61fCec_rroP6PxjXU2uLzUOaGaLgAPeUZAJrGuVp9nryKgbZceHckdHDYgJd9TsdJ1MYUsXaOb9joN9vmsCscBx1lwSlFQyNQsHUsrjuDk-opf6RCuazRQ9gkoDCX70HV8WBMFoVm-YWQKJHZEaIQxg_DU4gMFyKRkDGKsYKA0POL-UgWA1qkg6nHY5BOMKaqxbc5ky87muWB5nNk4mfmsckyFv9j1gBiXLKekA_y4UwG2o1pbOLpJS3bP_c95rm4M9ZBmGXqfOQhbjz8z-s9C11i-jmOQ2ByohS-ST3E5sqBzIsxxrxyQDTw--bZNhzpbciyYW4GfkkqyeYoOPd_84jPTBDKQXssvj8ZOj2XboS77tvEO1n1WlwUzh8HPCJod5_fEgSXuozpJtOggXBv0C2ps7yXlDZf-7Jar0UYc_NJEHJF-xShlqd6Q3sVL02PhSCM-ibn9DN9BKmD"
    }
    
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
    
    UPLOAD_DIR: str
    
    RABBITMQ_HOST: str
    RABBITMQ_PORT: int
    RABBITMQ_USER: str
    RABBITMQ_PASSWORD: str
    
    REDIS_HOST: str
    REDIS_PORT: int
    REDIS_PASSWORD: str
    
    @computed_field
    @property
    def REDIS_URL(self) -> str:
        return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/"
    
    @computed_field
    @property
    def RABBITMQ_URL(self) -> str:
        return f"amqp://{self.RABBITMQ_USER}:{self.RABBITMQ_PASSWORD}@{self.RABBITMQ_HOST}:{self.RABBITMQ_PORT}/"

settings = Settings()
