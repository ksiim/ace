import logging

from fastapi import FastAPI, Header, HTTPException, Request, status

from maxbot.handlers import MaxBotHandlers
from maxbot.settings import settings
from maxbot.update_parser import unwrap_updates


logger = logging.getLogger(__name__)

app = FastAPI(title="ACE MAX Bot")
handlers = MaxBotHandlers()


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/max/webhook")
async def max_webhook(
    request: Request,
    x_max_bot_api_secret: str | None = Header(default=None),
) -> dict[str, bool]:
    if settings.MAX_WEBHOOK_SECRET:
        if x_max_bot_api_secret != settings.MAX_WEBHOOK_SECRET:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid MAX webhook secret",
            )

    payload = await request.json()
    for update in unwrap_updates(payload):
        try:
            await handlers.handle_update(update)
        except Exception:
            logger.exception("Unhandled MAX webhook update error")

    return {"success": True}

