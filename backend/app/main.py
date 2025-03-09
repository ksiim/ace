from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from backend.app.api.main import api_router
from backend.app.core.config import settings


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разреши все источники (или настрой конкретные)
    allow_credentials=True,
    allow_methods=["*"],  # Разреши все методы (POST, GET, OPTIONS и т.д.)
    allow_headers=["*"],  # Разреши все заголовки
)

app.include_router(api_router, prefix=settings.API_V1_STR)

