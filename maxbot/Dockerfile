FROM python:3.12-slim

WORKDIR /app

COPY maxbot/requirements.txt /app/maxbot/requirements.txt
RUN pip install --no-cache-dir -r /app/maxbot/requirements.txt

COPY maxbot /app/maxbot

ENV PYTHONPATH=/app

CMD ["uvicorn", "maxbot.main:app", "--host", "0.0.0.0", "--port", "8010"]

