FROM python:3.12-slim

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app/

COPY --from=ghcr.io/astral-sh/uv:0.4.15 /uv /bin/uv

# Обновление PATH
ENV PATH="/app/.venv/bin:$PATH"
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Установка зависимостей через uv
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=bot/uv.lock,target=uv.lock \
    --mount=type=bind,source=bot/pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project

ENV PYTHONPATH=/app

# Копируем код приложения после установки зависимостей
COPY common /app/common
COPY bot /app/bot
COPY bot/pyproject.toml bot/uv.lock /app/

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync

CMD ["python", "bot/main.py"]