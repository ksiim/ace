import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import emails  # type: ignore
import jwt
from jinja2 import Template
from jwt.exceptions import InvalidTokenError

from backend.app.core import security
from backend.app.core.config import EMAIL_RESET_TOKEN_EXPIRE_HOURS, EMAILS_FROM_EMAIL, EMAILS_FROM_NAME, FRONTEND_HOST, PROJECT_NAME, SECRET_KEY, SMTP_HOST, SMTP_PASSWORD, SMTP_PORT, SMTP_USER

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class EmailData:
    html_content: str
    subject: str


async def render_email_template(*, template_name: str, context: dict[str, Any]) -> str:
    template_str = (
        Path(__file__).parent / "email-templates" / "build" / template_name
    ).read_text()
    html_content = Template(template_str).render(context)
    return html_content


async def send_email(
    *,
    email_to: str,
    subject: str = "",
    html_content: str = "",
) -> None:
    message = emails.Message(
        subject=subject,
        html=html_content,
        mail_from=(EMAILS_FROM_NAME, EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": SMTP_HOST, "port": SMTP_PORT}
    smtp_options["user"] = SMTP_USER
    smtp_options["password"] = SMTP_PASSWORD
    response = message.send(to=email_to, smtp=smtp_options)
    logger.info(f"send email result: {response}")


async def generate_reset_password_email(email_to: str, email: str, token: str) -> EmailData:
    project_name = PROJECT_NAME
    subject = f"{project_name} - Password recovery for user {email}"
    link = f"{FRONTEND_HOST}/reset-password?token={token}"
    html_content = await render_email_template(
        template_name="reset_password.html",
        context={
            "project_name": PROJECT_NAME,
            "username": email,
            "email": email_to,
            "valid_hours": EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": link,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


async def generate_new_account_email(
    email_to: str, username: str, password: str
) -> EmailData:
    project_name = PROJECT_NAME
    subject = f"{project_name} - New account for user {username}"
    html_content = await render_email_template(
        template_name="new_account.html",
        context={
            "project_name": PROJECT_NAME,
            "username": username,
            "password": password,
            "email": email_to,
            "link": FRONTEND_HOST,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


async def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.now(timezone.utc)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        SECRET_KEY,
        algorithm=security.ALGORITHM,
    )
    return encoded_jwt


async def verify_password_reset_token(token: str) -> str | None:
    try:
        decoded_token = jwt.decode(
            token, SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        return str(decoded_token["sub"])
    except InvalidTokenError:
        return None