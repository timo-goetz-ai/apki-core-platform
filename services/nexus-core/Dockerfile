FROM python:3.14-slim

WORKDIR /app

# System-Abhängigkeiten
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser

# Python-Abhängigkeiten zuerst (Layer-Caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Anwendungscode
COPY . .
RUN chown -R appuser:appgroup /app

USER appuser

# Port
EXPOSE 8000

# Start: Hot-reload im Dev-Modus via ENVIRONMENT-Variable
CMD ["sh", "-c", \
  "if [ \"$ENVIRONMENT\" = 'development' ]; then \
     uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload; \
   else \
     uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2; \
   fi"]
