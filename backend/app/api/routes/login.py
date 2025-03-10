from datetime import timedelta
from typing import Annotated, Any
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm

from backend.app.api.deps import CurrentUser, SessionDep
from backend.app.core import security
from backend.app.core.config import settings
from backend.app.utils import generate_password_reset_token, generate_reset_password_email, send_email, verify_password_reset_token, logger
import backend.app.crud.user as user_crud
from common.db.models.base import Message, NewPassword, Token
from common.db.models.user import User


router = APIRouter(tags=["login"])


@router.post("/access-token")
async def login_access_token(
    session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = await user_crud.authenticate(
        session=session, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=await security.create_access_token(
            user.id, expires_delta=access_token_expires
        )
    )


@router.post("/password-recovery/{email}")
async def recover_password(email: str, session: SessionDep) -> Message:
    """
    Password Recovery
    """
    user = await user_crud.get_user_by_email(session=session, email=email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    password_reset_token = await generate_password_reset_token(email=email)
    email_data = await generate_reset_password_email(
        email_to=user.email, email=email, token=password_reset_token
    )
    await send_email(
        email_to=user.email,
        subject=email_data.subject,
        html_content=email_data.html_content,
    )
    return Message(message="Password recovery email sent")


@router.post("/reset-password/")
async def reset_password(session: SessionDep, body: NewPassword) -> Message:
    """
    Reset password
    """
    user_id = int(await verify_password_reset_token(token=body.token))
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid token")
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist in the system.",
        )
    hashed_password = await security.get_password_hash(password=body.new_password)
    user.hashed_password = hashed_password
    session.add(user)
    await session.commit()
    return Message(message="Password updated successfully")


@router.post(
    "/check-reset-password-token/{token}",
)
async def check_reset_password_token(
    token: str
) -> Any:
    """
    Check token
    """
    user_id = await verify_password_reset_token(token=token)
    flag = False
    if user_id: 
        flag = True
    return {"valid": flag}

