import json
import uuid
from typing import Any, Optional
from typing import Any, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, update
from sqlmodel import col, delete, func, select

from backend.app import crud
from backend.app.api.deps import (
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
)
from backend.app.core.config import GATEWAY_TOKEN, SUPERUSER_EMAIL, SUPERUSER_PASSWORD
from backend.app.core.security import get_password_hash, verify_password
from common.db.models import Message, UpdatePassword, User, UserCreate, UserPublic, UserRegister, UserUpdate, UserUpdateMe, UsersPublic


router = APIRouter()


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=UsersPublic,
)
async def read_users(
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve users.
    """
    count_statement = select(func.count()).select_from(User)
    count = (await session.execute(count_statement)).scalar_one_or_none()

    statement = select(User).offset(skip).limit(limit)
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
        email=SUPERUSER_EMAIL,
        hashed_password=await get_password_hash(SUPERUSER_PASSWORD),
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
    user = await crud.get_user_by_email(session=session, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    user_create = UserCreate.model_validate(user_in)
    user = await crud.create_user(session=session, user_create=user_create)
    return user



@router.get(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
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
        existing_user = await crud.get_user_by_email(session=session, email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409, detail="User with this email already exists"
            )
    user_data = user_in.model_dump(exclude_unset=True)
    current_user.sqlmodel_update(user_data)
    session.add(current_user)
    await session.commit()
    await session.refresh(current_user)
    return current_user

@router.delete(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
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
    dependencies=[Depends(get_current_active_superuser)],
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
    
    user = await crud.update_user(session=session, db_user=db_user, user_in=user_in)
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
        "Authorization": f"Bearer {GATEWAY_TOKEN}",
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, data=json_body, headers=headers)
    if response.status_code != 200 or response.json()["ok"] != True:
        raise HTTPException(status_code=400, detail={"detail": "Failed to send phone verification code", "response": response.json()})
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
        "Authorization": f"Bearer {GATEWAY_TOKEN}",
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(url, data=json_body, headers=headers)
    if response.status_code != 200 or response.json()["ok"] != True:
        raise HTTPException(status_code=400, detail={"detail": "Failed to verify phone verification code", "response": response.json()})
    return {"message": "Phone verification code verified successfully", "response": response.json()}
