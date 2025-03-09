import logging
from pydantic_settings import BaseSettings, SettingsConfigDict


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    bot_token: str
    rabbitmq_url: str = "amqp://guest:guest@rabbitmq:5672/"
    env: str

    
settings = Settings()
logger.info(f"Loaded settings: bot_token={settings.bot_token[:5]}..., env={settings.env}")