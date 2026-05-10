import asyncio
import sys

import httpx

from maxbot.settings import settings


async def main() -> int:
    if not settings.MAX_BOT_TOKEN:
        print("MAX_BOT_TOKEN is empty")
        return 1

    if len(sys.argv) < 2:
        print("Usage: python -m maxbot.setup_webhook https://example.com/max/webhook")
        return 1

    webhook_url = sys.argv[1]
    payload = {
        "url": webhook_url,
        "update_types": ["message_created", "bot_started"],
    }
    if settings.MAX_WEBHOOK_SECRET:
        payload["secret"] = settings.MAX_WEBHOOK_SECRET

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            f"{settings.MAX_API_BASE_URL.rstrip('/')}/subscriptions",
            headers={
                "Authorization": settings.MAX_BOT_TOKEN,
                "Content-Type": "application/json",
            },
            json=payload,
        )

    print(response.status_code)
    print(response.text)
    return 0 if response.status_code < 400 else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))

