import datetime
import json
import uuid
from typing import Any, Optional
from typing import Any, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, or_, update
from sqlmodel import col, delete, func, select

from backend.app.crud import user as user_crud
from backend.app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_admin,
    get_current_user,
)
from backend.app.core.config import settings
from backend.app.core.security import get_password_hash, verify_password
from common.db.models import Message, UpdatePassword, User, UserCreate, UserFio, UserPublic, UserRegister, UserUpdate, UserUpdateMe, UsersPublic
from common.db.models.category import Category
from common.db.models.enums import OrderEnum
from common.db.models.participant import TournamentParticipant
from common.db.models.region import Region
from common.db.models.tournament import Tournament, TournamentCountResponse


router = APIRouter()

@router.get(
    "/",
    # dependencies=[Depends(get_current_user)],
    response_model=UsersPublic,
)
async def read_users(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    region_id: Optional[int] = None,
    is_organizer: Optional[bool] = None,
    is_admin: Optional[bool] = None,
    score_order: Optional[OrderEnum] = None,
    fio: Optional[str] = None,
    age_order: Optional[OrderEnum] = None,
) -> Any:
    """
    Retrieve users with filters and sorting options.
    """
    count_statement = select(func.count()).select_from(User)
    
    statement = select(User)

    if category_id is not None:
        category_stmt = select(Category).where(Category.id == category_id)
        category = (await session.execute(category_stmt)).scalars().first()
        if category:
            statement = statement.where(
                User.age.between(category.from_age, category.to_age)
            )
            count_statement = count_statement.where(
                User.age.between(category.from_age, category.to_age)
            )
    
    if region_id is not None:
        statement = statement.where(User.region_id == region_id)
        count_statement = count_statement.where(User.region_id == region_id)

    if is_organizer is not None:
        statement = statement.where(User.organizer == is_organizer)
        count_statement = count_statement.where(User.organizer == is_organizer)

    if is_admin is not None:
        statement = statement.where(User.admin == is_admin)
        count_statement = count_statement.where(User.admin == is_admin)
        
    if fio is not None:
        fio_parts = fio.strip().split()
        
        if len(fio_parts) >= 1:  # Фамилия
            statement = statement.where(User.surname.ilike(f"%{fio_parts[0]}%"))
            count_statement = count_statement.where(User.surname.ilike(f"%{fio_parts[0]}%"))
        if len(fio_parts) >= 2:  # Имя
            statement = statement.where(User.name.ilike(f"%{fio_parts[1]}%"))
            count_statement = count_statement.where(User.name.ilike(f"%{fio_parts[1]}%"))
        if len(fio_parts) >= 3:  # Отчество
            statement = statement.where(User.patronymic.ilike(f"%{fio_parts[2]}%"))
            count_statement = count_statement.where(User.patronymic.ilike(f"%{fio_parts[2]}%"))

    if score_order == OrderEnum.desc:
        statement = statement.order_by(desc(User.score))
    elif score_order == OrderEnum.asc:
        statement = statement.order_by(User.score)

    if age_order == OrderEnum.asc:
        statement = statement.order_by(User.birth_date.desc())
    elif age_order == OrderEnum.desc:
        statement = statement.order_by(User.birth_date.asc())

    statement = statement.offset(skip).limit(limit)

    count = (await session.execute(count_statement)).scalar_one_or_none()
    users = (await session.execute(statement)).scalars().all()

    return UsersPublic(data=users, count=count)


@router.get(
    "/create_super_user",
)
async def create_super_user(
    session: SessionDep,
) -> Any:
    """
    Create a super user
    """
    user = User(
        email=settings.SUPERUSER_EMAIL,
        hashed_password=await get_password_hash(settings.SUPERUSER_PASSWORD),
        admin=True,
    )
    session.add(user)
    await session.commit()
    return 'Super user created'


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> Any:
    """
    Get current user.
    """
    return current_user


@router.get('/{user_id}/fio', response_model=UserFio)
async def read_user_fio(session: SessionDep, user_id: int) -> Any:
    """
    Retrieve user's full name by id.
    """
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserFio(name=user.name, surname=user.surname, patronymic=user.patronymic)


@router.delete("/me", response_model=Message)
async def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Any:
    """
    Delete own user.
    """
    if current_user.admin:
        raise HTTPException(
            status_code=403, detail="Super users are not allowed to delete themselves"
        )
    await session.delete(current_user)
    await session.commit()
    return Message(message="User deleted successfully")


@router.post("/signup", response_model=UserPublic)
async def register_user(session: SessionDep, user_in: UserRegister) -> Any:
    """
    Create new user without the need to be logged in.
    """
    user = await user_crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    region = await session.get(Region, user_in.region_id)
    if not region:
        raise HTTPException(status_code=400, detail="Invalid region_id")
    
    user_create = UserCreate.model_validate(user_in)
    user = await user_crud.create_user(session=session, user_create=user_create)
    return user


@router.get(
    "/{user_id}",
    # dependencies=[Depends(get_current_user)],
    response_model=UserPublic,
)
async def read_user_by_id(
    session: SessionDep,
    user_id: int,
) -> Any:
    """
    Retrieve user by id.
    """
    user = await session.get(User, user_id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/me", response_model=UserPublic)
async def update_user_me(
    *, session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser
) -> Any:
    """
    Update own user.
    """

    if user_in.email:
        existing_user = await user_crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )

    await user_crud.update_user(session=session, db_user=current_user, user_in=user_in)
    return current_user

@router.delete(
    "/{user_id}",
    dependencies=[Depends(get_current_admin)],
)
async def delete_user_by_id(
    session: SessionDep,
    user_id: int,
) -> Any:
    """
    Delete user by id.
    """
    user_found = await session.get(User, user_id)
    if user_found is None:
        raise HTTPException(status_code=404, detail="User not found")

    statement = delete(User).where(User.id == user_id)
    await session.execute(statement)
    await session.commit()
    return {"message": "User deleted successfully"}


@router.put(
    "/{user_id}",
    #dependencies=[Depends(get_current_admin)],
)
async def update_user_by_id(
    session: SessionDep,
    user_id: int,
    user_in: UserUpdate,
) -> Any:
    """
    Update user by id.
    """
    db_user = await session.get(User, user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user = await user_crud.update_user(session=session, db_user=db_user, user_in=user_in)
    return user


@router.patch("/me/password", response_model=Message)
async def update_password_me(
    *, session: SessionDep, body: UpdatePassword, current_user: CurrentUser
) -> Any:
    """
    Update own password.
    """
    if not await verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=400, detail="New password cannot be the same as the current one"
        )
    hashed_password = await get_password_hash(body.new_password)
    current_user.hashed_password = hashed_password
    session.add(current_user)
    await session.commit()
    return Message(message="Password updated successfully")


@router.get("/send_phone_verification_code/")
async def send_phone_verification_code(session: SessionDep, phone_number: str) -> Any:
    """
    Send phone verification code.
    """
    url = "https://gatewayapi.telegram.org/sendVerificationMessage"
    json_body = {
        "phone_number": phone_number,
        "code_length": 4,
        "ttl": 2400,
    }
    json_body = json.dumps(json_body)
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.GATEWAY_TOKEN}",
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, data=json_body, headers=headers)
    if response.status_code != 200 or response.json()["ok"] != True:
        raise HTTPException(status_code=400, detail={
                            "detail": "Failed to send phone verification code", "response": response.json()})
    return {"message": "Phone verification code sent successfully", "response": response.json()}


@router.get("/verify_code/")
async def check_verification_status(session: SessionDep, request_id: str, code: str) -> Any:
    """
    Verify phone verification code.
    """
    url = "https://gatewayapi.telegram.org/checkVerificationStatus"
    json_body = {
        "request_id": request_id,
        "code": code,
    }
    json_body = json.dumps(json_body)
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.GATEWAY_TOKEN}",
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, data=json_body, headers=headers)
    if response.status_code != 200 or response.json()["ok"] != True:
        raise HTTPException(status_code=400, detail={
                            "detail": "Failed to verify phone verification code", "response": response.json()})
    return {"message": "Phone verification code verified successfully", "response": response.json()}

@router.get(
    "/{user_id}/tournament-count-per-52-weeks",
    response_model=TournamentCountResponse,
)
async def get_user_tournament_count_per_52_weeks(
    user_id: int,
    session: SessionDep,  # AsyncSession
) -> TournamentCountResponse:
    """
    Get the count of tournaments a user participated in over the last 52 weeks.
    """
    # Проверяем, существует ли пользователь
    user_exists = await session.get(User, user_id)
    if not user_exists:
        raise HTTPException(status_code=404, detail="User not found")

    fifty_two_weeks_ago = datetime.datetime.now().date() - datetime.timedelta(weeks=52)
    stmt = (
        select(func.count(TournamentParticipant.id))
        .join(Tournament, TournamentParticipant.tournament_id == Tournament.id)
        .where(
            or_(
                TournamentParticipant.user_id == user_id,
                TournamentParticipant.partner_id == user_id
            ),
            Tournament.date >= fifty_two_weeks_ago
        )
    )
    result = await session.execute(stmt)
    count = result.scalar_one()

    return TournamentCountResponse(count_of_tournament_last_52_weeks=count)
