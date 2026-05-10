import base64
import hashlib
import hmac
import json
import re
import secrets
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException

from backend.app.core.config import settings
from backend.app.utils.utils import redis


SESSION_PREFIX = "max_registration:"
USER_PREFIX = "max_registration_user:"
STATUS_PENDING = "pending"
STATUS_CONTACT_REQUESTED = "contact_requested"
STATUS_VERIFIED = "verified"
STATUS_FAILED = "failed"


def normalize_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 10:
        return f"7{digits}"
    if len(digits) == 11 and digits.startswith("8"):
        return f"7{digits[1:]}"
    return digits


def generate_registration_token() -> str:
    return secrets.token_urlsafe(24)


def build_bot_link(token: str) -> str:
    base_link = settings.MAX_BOT_LINK.strip()
    if not base_link:
        raise HTTPException(status_code=500, detail="MAX_BOT_LINK is not configured")

    separator = "&" if "?" in base_link else "?"
    return f"{base_link}{separator}start={token}"


async def create_registration_session(phone_number: str) -> dict[str, Any]:
    normalized_phone = normalize_phone(phone_number)
    if len(normalized_phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone number")

    token = generate_registration_token()
    session = {
        "registration_token": token,
        "phone_number": normalized_phone,
        "status": STATUS_PENDING,
        "verified": False,
        "max_user_id": None,
        "max_chat_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await _save_session(token, session)
    return session


async def get_registration_session(token: str) -> dict[str, Any] | None:
    raw = await redis.get(_session_key(token))
    if not raw:
        return None
    return json.loads(raw)


async def bind_max_user(
    *,
    registration_token: str,
    max_user_id: int,
    max_chat_id: int | None,
) -> dict[str, Any]:
    session = await get_registration_session(registration_token)
    if not session:
        raise HTTPException(status_code=404, detail="Registration session not found")
    if session.get("status") == STATUS_VERIFIED:
        return session

    session["max_user_id"] = max_user_id
    session["max_chat_id"] = max_chat_id
    session["status"] = STATUS_CONTACT_REQUESTED
    await _save_session(registration_token, session)
    await redis.set(
        _user_key(max_user_id),
        registration_token,
        ex=settings.MAX_REGISTRATION_TTL_SECONDS,
    )
    return session


async def verify_contact_for_user(
    *,
    max_user_id: int,
    max_chat_id: int | None,
    contact_payload: dict[str, Any],
) -> dict[str, Any]:
    registration_token = await redis.get(_user_key(max_user_id))
    if not registration_token:
        raise HTTPException(status_code=404, detail="Active registration session not found")

    session = await get_registration_session(registration_token)
    if not session:
        raise HTTPException(status_code=404, detail="Registration session not found")

    vcf_info = _get_contact_value(contact_payload, "vcf_info", "vcfInfo", "vcard", "vCard")
    contact_hash = _get_contact_value(contact_payload, "hash")

    if not vcf_info or not contact_hash:
        session["status"] = STATUS_FAILED
        session["failure_reason"] = "MAX contact payload has no vcf_info or hash"
        await _save_session(registration_token, session)
        raise HTTPException(status_code=400, detail="Invalid MAX contact payload")

    if not verify_contact_hash(vcf_info, contact_hash):
        session["status"] = STATUS_FAILED
        session["failure_reason"] = "Invalid MAX contact hash"
        await _save_session(registration_token, session)
        raise HTTPException(status_code=400, detail="Invalid MAX contact hash")

    contact_phone = extract_phone_from_contact(contact_payload, vcf_info)
    if not contact_phone:
        session["status"] = STATUS_FAILED
        session["failure_reason"] = "MAX contact payload has no phone"
        await _save_session(registration_token, session)
        raise HTTPException(status_code=400, detail="MAX contact payload has no phone")

    normalized_contact_phone = normalize_phone(contact_phone)
    if normalized_contact_phone != session["phone_number"]:
        session["status"] = STATUS_FAILED
        session["failure_reason"] = "MAX phone does not match registration phone"
        session["max_phone_number"] = normalized_contact_phone
        await _save_session(registration_token, session)
        raise HTTPException(
            status_code=400,
            detail="MAX phone does not match registration phone",
        )

    session["status"] = STATUS_VERIFIED
    session["verified"] = True
    session["max_user_id"] = max_user_id
    session["max_chat_id"] = max_chat_id
    session["max_phone_number"] = normalized_contact_phone
    await _save_session(registration_token, session)
    return session


async def require_verified_registration(
    *,
    registration_token: str,
    phone_number: str,
) -> dict[str, Any]:
    session = await get_registration_session(registration_token)
    if not session:
        raise HTTPException(status_code=400, detail="MAX registration session not found")
    if session.get("status") != STATUS_VERIFIED or not session.get("verified"):
        raise HTTPException(status_code=400, detail="MAX registration is not verified")
    if normalize_phone(phone_number) != session.get("phone_number"):
        raise HTTPException(
            status_code=400,
            detail="MAX registration phone does not match signup phone",
        )
    return session


async def mark_registration_used(registration_token: str) -> None:
    session = await get_registration_session(registration_token)
    if not session:
        return
    max_user_id = session.get("max_user_id")
    session["status"] = "used"
    await _save_session(registration_token, session)
    if max_user_id is not None:
        await redis.delete(_user_key(max_user_id))


def verify_contact_hash(vcf_info: str, contact_hash: str) -> bool:
    if not settings.MAX_BOT_TOKEN:
        raise HTTPException(status_code=500, detail="MAX_BOT_TOKEN is not configured")

    digest = hmac.new(
        settings.MAX_BOT_TOKEN.encode(),
        vcf_info.encode(),
        hashlib.sha256,
    ).digest()
    expected_values = {
        digest.hex(),
        base64.b64encode(digest).decode(),
        base64.urlsafe_b64encode(digest).decode().rstrip("="),
    }
    return any(hmac.compare_digest(contact_hash, expected) for expected in expected_values)


def extract_phone_from_contact(contact_payload: dict[str, Any], vcf_info: str) -> str | None:
    direct_phone = _get_contact_value(
        contact_payload,
        "phone",
        "phone_number",
        "phoneNumber",
    )
    if direct_phone:
        return direct_phone

    match = re.search(r"TEL[^:\n\r]*:([^\n\r]+)", vcf_info, flags=re.IGNORECASE)
    if match:
        return match.group(1)
    return None


def _get_contact_value(payload: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = payload.get(key)
        if isinstance(value, str):
            return value
    return None


async def _save_session(token: str, session: dict[str, Any]) -> None:
    await redis.set(
        _session_key(token),
        json.dumps(session),
        ex=settings.MAX_REGISTRATION_TTL_SECONDS,
    )


def _session_key(token: str) -> str:
    return f"{SESSION_PREFIX}{token}"


def _user_key(max_user_id: int) -> str:
    return f"{USER_PREFIX}{max_user_id}"
