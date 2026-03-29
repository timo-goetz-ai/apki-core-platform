FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 appgroup \
    && adduser --system --uid 1001 --gid 1001 appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chown -R appuser:appgroup /app

USER appuser

# Webhook mode — port for incoming Telegram updates
EXPOSE 8443

CMD ["python", "bot.py"]
