from fastapi import APIRouter

from backend.app.api.routes import users

api_router = APIRouter()
api_router.include_router(users.router, tags=["login"])