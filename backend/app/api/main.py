from fastapi import APIRouter

from backend.app.api.routes import users, login, tournaments

api_router = APIRouter()
api_router.include_router(users.router, tags=["users"], prefix="/users")
api_router.include_router(login.router, prefix="/login")
api_router.include_router(tournaments.router, tags=["tournaments"], prefix="/tournaments")
