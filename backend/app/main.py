from fastapi import FastAPI
from sqlalchemy.orm import Session
from backend.app.api.main import api_router
from backend.app.core.config import API_V1_STR

app = FastAPI()

app.include_router(api_router, prefix=API_V1_STR)