from typing import Any

from fastapi import APIRouter, Header, HTTPException, status
from pydantic import BaseModel

from backend.app.core.config import settings
from backend.app.utils import max_registration


router = APIRouter()


class MaxRegistrationSessionCreate(BaseModel):
    phone_number: str


class MaxRegistrationSessionPublic(BaseModel):
    registration_token: str
    bot_link: str
    status: str


class MaxRegistrationStatusPublic(BaseModel):
    registration_token: str
    status: str
    verified: bool


class MaxRegistrationStart(BaseModel):
    registration_token: str
    max_user_id: int
    max_chat_id: int | None = None
    raw_update: dict[str, Any] | None = None


class MaxRegistrationContact(BaseModel):
    max_user_id: int
    max_chat_id: int | None = None
    contact_payload: dict[str, Any]
    raw_update: dict[str, Any] | None = None


@router.post(
    "/session",
    response_model=MaxRegistrationSessionPublic,
)
async def create_max_registration_session(
    body: MaxRegistrationSessionCreate,
) -> MaxRegistrationSessionPublic:
    session = await max_registration.create_registration_session(body.phone_number)
    token = session["registration_token"]
    return MaxRegistrationSessionPublic(
        registration_token=token,
        bot_link=max_registration.build_bot_link(token),
        status=session["status"],
    )


@router.get(
    "/status/{registration_token}",
    response_model=MaxRegistrationStatusPublic,
)
async def get_max_registration_status(
    registration_token: str,
) -> MaxRegistrationStatusPublic:
    session = await max_registration.get_registration_session(registration_token)
    if not session:
        return MaxRegistrationStatusPublic(
            registration_token=registration_token,
            status="expired",
            verified=False,
        )
    return MaxRegistrationStatusPublic(
        registration_token=registration_token,
        status=session["status"],
        verified=bool(session.get("verified")),
    )


@router.post("/start")
async def start_max_registration(
    body: MaxRegistrationStart,
    x_maxbot_token: str | None = Header(default=None),
) -> dict[str, str]:
    _validate_maxbot_token(x_maxbot_token)
    await max_registration.bind_max_user(
        registration_token=body.registration_token,
        max_user_id=body.max_user_id,
        max_chat_id=body.max_chat_id,
    )
    return {"message": "MAX registration started"}


@router.post("/contact")
async def submit_max_registration_contact(
    body: MaxRegistrationContact,
    x_maxbot_token: str | None = Header(default=None),
) -> dict[str, str]:
    _validate_maxbot_token(x_maxbot_token)
    await max_registration.verify_contact_for_user(
        max_user_id=body.max_user_id,
        max_chat_id=body.max_chat_id,
        contact_payload=body.contact_payload,
    )
    return {
        "message": "Номер подтвержден. Вернитесь на сайт, регистрация продолжится автоматически."
    }


def _validate_maxbot_token(x_maxbot_token: str | None) -> None:
    if not settings.MAXBOT_INTERNAL_TOKEN:
        return
    if x_maxbot_token != settings.MAXBOT_INTERNAL_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid MAX bot token",
        )

