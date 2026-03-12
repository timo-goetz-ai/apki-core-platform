FROM python:3.11-slim

WORKDIR /app

# System-Abhängigkeiten
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Python-Abhängigkeiten zuerst (Layer-Caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Anwendungscode
COPY . .

# Port
EXPOSE 8000

# Start: Hot-reload im Dev-Modus via ENVIRONMENT-Variable
CMD ["sh", "-c", \
  "if [ \"$ENVIRONMENT\" = 'development' ]; then \
     uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload; \
   else \
     uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2; \
   fi"]
