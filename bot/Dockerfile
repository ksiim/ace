# Stage 1: Сборка зависимостей
FROM python:3.12-slim as builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем uv
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

# Копируем код приложения
COPY common /app/common
COPY bot /app/bot
COPY bot/pyproject.toml bot/uv.lock /app/

# Установка зависимостей для приложения
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync

# Stage 2: Финальный образ
FROM python:3.12-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем виртуальное окружение из builder
COPY --from=builder /app/.venv /app/.venv

# Копируем код приложения
COPY --from=builder /app/common /app/common
COPY --from=builder /app/bot /app/bot

# Обновление PATH
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH=/app

# Запускаем бота
CMD ["python", "bot/main.py"]