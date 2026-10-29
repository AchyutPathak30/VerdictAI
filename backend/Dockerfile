# VerdictAI API image. Build from the repo root: the API imports backend/, database/
# and akshay_ml_fairweighing/ as top-level packages.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend backend
COPY database database
COPY akshay_ml_fairweighing akshay_ml_fairweighing

RUN useradd --create-home verdictai
USER verdictai

EXPOSE 8000
# Shell form so Render/Railway can inject $PORT
CMD uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}
