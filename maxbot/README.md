# MAX bot

This service handles MAX registration verification for ACE.

## Flow

1. The site creates a registration verification token on the backend.
2. The user opens the MAX bot with `/start <token>` or sends the token manually.
3. The bot sends the token and MAX user data to the backend.
4. The bot asks the user to share a phone number with a `request_contact` button.
5. The bot forwards the contact payload to the backend.
6. The backend verifies the contact hash and phone number, then marks the registration session as verified.

## Environment

```env
MAX_BOT_TOKEN=
MAX_WEBHOOK_SECRET=
BACKEND_INTERNAL_URL=http://backend:8000
BACKEND_MAXBOT_TOKEN=
```

Optional:

```env
MAX_API_BASE_URL=https://platform-api.max.ru
BACKEND_MAX_START_PATH=/api/v1/max/registration/start
BACKEND_MAX_CONTACT_PATH=/api/v1/max/registration/contact
```

## Webhook setup

After the bot token is available and the service is deployed behind HTTPS:

```bash
python -m maxbot.setup_webhook https://your-domain.com/max/webhook
```

The public endpoint must be HTTPS.
