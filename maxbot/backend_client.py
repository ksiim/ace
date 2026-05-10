from typing import Any

import httpx

from maxbot.settings import settings


class BackendApiError(RuntimeError):
    pass


class BackendClient:
    async def start_registration(
        self,
        *,
        registration_token: str,
        max_user_id: int,
        max_chat_id: int | None,
        raw_update: dict[str, Any],
    ) -> dict[str, Any]:
        return await self._post(
            settings.backend_start_url,
            {
                "registration_token": registration_token,
                "max_user_id": max_user_id,
                "max_chat_id": max_chat_id,
                "raw_update": raw_update,
            },
        )

    async def submit_contact(
        self,
        *,
        max_user_id: int,
        max_chat_id: int | None,
        contact_payload: dict[str, Any],
        raw_update: dict[str, Any],
    ) -> dict[str, Any]:
        return await self._post(
            settings.backend_contact_url,
            {
                "max_user_id": max_user_id,
                "max_chat_id": max_chat_id,
                "contact_payload": contact_payload,
                "raw_update": raw_update,
            },
        )

    async def _post(self, url: str, payload: dict[str, Any]) -> dict[str, Any]:
        headers = {}
        if settings.BACKEND_MAXBOT_TOKEN:
            headers["X-Maxbot-Token"] = settings.BACKEND_MAXBOT_TOKEN

        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(url, json=payload, headers=headers)

        if response.status_code >= 400:
            raise BackendApiError(
                f"Backend API error {response.status_code}: {response.text}"
            )
        if not response.content:
            return {}
        return response.json()
