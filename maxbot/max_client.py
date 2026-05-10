from typing import Any

import httpx

from maxbot.settings import settings


class MaxApiError(RuntimeError):
    pass


class MaxClient:
    def __init__(self, token: str = settings.MAX_BOT_TOKEN) -> None:
        self.token = token
        self.base_url = settings.MAX_API_BASE_URL.rstrip("/")

    @property
    def headers(self) -> dict[str, str]:
        return {
            "Authorization": self.token,
            "Content-Type": "application/json",
        }

    async def send_message(
        self,
        *,
        text: str,
        user_id: int | None = None,
        chat_id: int | None = None,
        attachments: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        if user_id is None and chat_id is None:
            raise ValueError("Either user_id or chat_id must be provided")

        params: dict[str, int] = {}
        if user_id is not None:
            params["user_id"] = user_id
        elif chat_id is not None:
            params["chat_id"] = chat_id

        payload: dict[str, Any] = {
            "text": text,
            "notify": True,
        }
        if attachments is not None:
            payload["attachments"] = attachments

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                f"{self.base_url}/messages",
                params=params,
                json=payload,
                headers=self.headers,
            )

        if response.status_code >= 400:
            raise MaxApiError(
                f"MAX API error {response.status_code}: {response.text}"
            )
        return response.json()

    async def send_contact_request(
        self,
        *,
        user_id: int | None = None,
        chat_id: int | None = None,
    ) -> dict[str, Any]:
        return await self.send_message(
            user_id=user_id,
            chat_id=chat_id,
            text="Нажмите кнопку ниже, чтобы подтвердить номер телефона через MAX.",
            attachments=[
                {
                    "type": "inline_keyboard",
                    "payload": {
                        "buttons": [
                            [
                                {
                                    "type": "request_contact",
                                    "text": "Поделиться номером",
                                }
                            ]
                        ]
                    },
                }
            ],
        )

    async def send_plain_text(
        self,
        *,
        text: str,
        user_id: int | None = None,
        chat_id: int | None = None,
    ) -> dict[str, Any]:
        return await self.send_message(text=text, user_id=user_id, chat_id=chat_id)
