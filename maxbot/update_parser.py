import re
from typing import Any


TOKEN_RE = re.compile(r"^[A-Za-z0-9_-]{6,160}$")


def unwrap_updates(payload: dict[str, Any]) -> list[dict[str, Any]]:
    updates = payload.get("updates")
    if isinstance(updates, list):
        return [update for update in updates if isinstance(update, dict)]
    return [payload]


def get_update_type(update: dict[str, Any]) -> str | None:
    value = update.get("update_type") or update.get("type")
    return value if isinstance(value, str) else None


def get_message(update: dict[str, Any]) -> dict[str, Any] | None:
    message = update.get("message")
    if isinstance(message, dict):
        return message

    # Some integrations put message fields directly into the update.
    if isinstance(update.get("body"), dict):
        return update
    return None


def get_sender(update: dict[str, Any]) -> dict[str, Any] | None:
    message = get_message(update)
    candidates = [
        update.get("user"),
        update.get("sender"),
        message.get("sender") if message else None,
    ]
    for candidate in candidates:
        if isinstance(candidate, dict):
            return candidate
    return None


def get_user_id(update: dict[str, Any]) -> int | None:
    sender = get_sender(update)
    if not sender:
        return None

    for key in ("user_id", "id"):
        value = sender.get(key)
        if isinstance(value, int):
            return value
        if isinstance(value, str) and value.isdigit():
            return int(value)
    return None


def get_chat_id(update: dict[str, Any]) -> int | None:
    value = update.get("chat_id")
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.isdigit():
        return int(value)

    message = get_message(update)
    if not message:
        return None

    recipient = message.get("recipient")
    if isinstance(recipient, dict):
        for key in ("chat_id", "id"):
            value = recipient.get(key)
            if isinstance(value, int):
                return value
            if isinstance(value, str) and value.isdigit():
                return int(value)
    return None


def get_text(update: dict[str, Any]) -> str | None:
    message = get_message(update)
    if not message:
        return None

    body = message.get("body")
    if isinstance(body, dict) and isinstance(body.get("text"), str):
        return body["text"].strip()
    if isinstance(message.get("text"), str):
        return message["text"].strip()
    return None


def extract_registration_token(text: str | None) -> str | None:
    if not text:
        return None

    parts = text.strip().split()
    if not parts:
        return None

    if parts[0].startswith("/start"):
        if len(parts) < 2:
            return None
        token = parts[1]
    else:
        token = parts[0]

    token = token.strip()
    if TOKEN_RE.match(token):
        return token
    return None


def extract_registration_token_from_update(update: dict[str, Any]) -> str | None:
    for key in ("payload", "start_payload", "startPayload", "ref", "referrer"):
        value = update.get(key)
        if isinstance(value, str):
            token = extract_registration_token(value)
            if token is not None:
                return token

    link = update.get("link")
    if isinstance(link, dict):
        for key in ("payload", "start_payload", "startPayload", "ref", "referrer"):
            value = link.get(key)
            if isinstance(value, str):
                token = extract_registration_token(value)
                if token is not None:
                    return token

    return extract_registration_token(get_text(update))


def get_contact_payload(update: dict[str, Any]) -> dict[str, Any] | None:
    message = get_message(update)
    if not message:
        return None

    body = message.get("body")
    if not isinstance(body, dict):
        return None

    attachments = body.get("attachments")
    if not isinstance(attachments, list):
        return None

    for attachment in attachments:
        if not isinstance(attachment, dict):
            continue
        if attachment.get("type") != "contact":
            continue
        payload = attachment.get("payload")
        if isinstance(payload, dict):
            return payload
    return None
