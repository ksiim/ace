from contextlib import asynccontextmanager
from backend.app.messaging.consumer import start_consumer, stop_consumer
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend.app.api.main import api_router
from backend.app.core.config import settings
import logging


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting FastAPI application and RabbitMQ consumer...")
    app.state.rabbitmq_connection = await start_consumer()
    yield
    logger.info("Shutting down FastAPI application...")
    await stop_consumer(app.state.rabbitmq_connection)
    
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разреши все источники (или настрой конкретные)
    allow_credentials=True,
    allow_methods=["*"],  # Разреши все методы (POST, GET, OPTIONS и т.д.)
    allow_headers=["*"],  # Разреши все заголовки
)

app.include_router(api_router, prefix=settings.API_V1_STR)

