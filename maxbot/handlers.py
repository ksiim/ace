import logging
from typing import Any

from maxbot.backend_client import BackendApiError, BackendClient
from maxbot.max_client import MaxApiError, MaxClient
from maxbot.update_parser import (
    extract_registration_token,
    extract_registration_token_from_update,
    get_chat_id,
    get_contact_payload,
    get_text,
    get_update_type,
    get_user_id,
)


logger = logging.getLogger(__name__)


class MaxBotHandlers:
    def __init__(
        self,
        *,
        max_client: MaxClient | None = None,
        backend_client: BackendClient | None = None,
    ) -> None:
        self.max_client = max_client or MaxClient()
        self.backend_client = backend_client or BackendClient()

    async def handle_update(self, update: dict[str, Any]) -> None:
        update_type = get_update_type(update)
        logger.info(
            "MAX update received: type=%s user_id=%s chat_id=%s text=%r",
            update_type,
            get_user_id(update),
            get_chat_id(update),
            get_text(update),
        )

        if update_type in ("message_created", None):
            await self._handle_message(update)
            return

        if update_type == "bot_started":
            await self._handle_bot_started(update)
            return

        logger.info("Ignoring unsupported MAX update type: %s", update_type)

    async def _handle_bot_started(self, update: dict[str, Any]) -> None:
        user_id = get_user_id(update)
        chat_id = get_chat_id(update)
        if user_id is None and chat_id is None:
            logger.warning("bot_started update has no user_id/chat_id: %s", update)
            return

        token = extract_registration_token_from_update(update)
        if token is not None and user_id is not None:
            await self._handle_registration_token(
                update=update,
                user_id=user_id,
                chat_id=chat_id,
                registration_token=token,
            )
            return

        await self._safe_send_text(
            user_id=user_id,
            chat_id=chat_id,
            text=(
                "Для подтверждения регистрации откройте бота по ссылке с сайта "
                "или отправьте сюда код подтверждения."
            ),
        )

    async def _handle_message(self, update: dict[str, Any]) -> None:
        user_id = get_user_id(update)
        chat_id = get_chat_id(update)
        text = get_text(update)

        if user_id is None:
            logger.warning("message update has no user_id: %s", update)
            return

        if text in ("/ping", "ping"):
            await self._safe_send_text(
                user_id=user_id,
                chat_id=chat_id,
                text="pong",
            )
            return

        if text in ("/debug", "debug"):
            await self._safe_send_text(
                user_id=user_id,
                chat_id=chat_id,
                text=f"MAX bot debug: user_id={user_id}, chat_id={chat_id}",
            )
            return

        contact_payload = get_contact_payload(update)
        if contact_payload is not None:
            await self._handle_contact(
                update=update,
                user_id=user_id,
                chat_id=chat_id,
                contact_payload=contact_payload,
            )
            return

        token = extract_registration_token(text)
        if token is None:
            await self._safe_send_text(
                user_id=user_id,
                chat_id=chat_id,
                text=(
                    "Я подтверждаю регистрацию на сайте ACE. "
                    "Откройте меня по ссылке с сайта или отправьте код подтверждения."
                ),
            )
            return

        await self._handle_registration_token(
            update=update,
            user_id=user_id,
            chat_id=chat_id,
            registration_token=token,
        )

    async def _handle_registration_token(
        self,
        *,
        update: dict[str, Any],
        user_id: int,
        chat_id: int | None,
        registration_token: str,
    ) -> None:
        try:
            await self.backend_client.start_registration(
                registration_token=registration_token,
                max_user_id=user_id,
                max_chat_id=chat_id,
                raw_update=update,
            )
        except BackendApiError:
            logger.exception("Failed to bind MAX registration token")
            await self._safe_send_text(
                user_id=user_id,
                chat_id=chat_id,
                text="Не удалось найти активную регистрацию. Вернитесь на сайт и попробуйте еще раз.",
            )
            return

        try:
            await self.max_client.send_contact_request(user_id=user_id, chat_id=chat_id)
        except MaxApiError:
            logger.exception("Failed to send MAX contact request")
            await self._safe_send_text(
                user_id=user_id,
                chat_id=chat_id,
                text="Не удалось отправить кнопку подтверждения. Попробуйте позже.",
            )

    async def _handle_contact(
        self,
        *,
        update: dict[str, Any],
        user_id: int,
        chat_id: int | None,
        contact_payload: dict[str, Any],
    ) -> None:
        try:
            result = await self.backend_client.submit_contact(
                max_user_id=user_id,
                max_chat_id=chat_id,
                contact_payload=contact_payload,
                raw_update=update,
            )
        except BackendApiError:
            logger.exception("Failed to submit MAX contact")
            await self._safe_send_text(
                user_id=user_id,
                chat_id=chat_id,
                text="Не удалось подтвердить номер. Вернитесь на сайт и попробуйте еще раз.",
            )
            return

        message = result.get("message") if isinstance(result, dict) else None
        await self._safe_send_text(
            user_id=user_id,
            chat_id=chat_id,
            text=message or "Номер подтвержден. Вернитесь на сайт, регистрация продолжится автоматически.",
        )

    async def _safe_send_text(
        self,
        *,
        text: str,
        user_id: int | None,
        chat_id: int | None,
    ) -> None:
        try:
            await self.max_client.send_plain_text(
                user_id=user_id,
                chat_id=chat_id,
                text=text,
            )
        except MaxApiError:
            logger.exception("Failed to send MAX message")
