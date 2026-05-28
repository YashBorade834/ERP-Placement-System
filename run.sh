#!/usr/bin/env bash
set -euo pipefail

# ----------- Checks -----------
python -c "import sys; sys.exit(int(sys.version_info < (3,10)))" || { echo "Python 3.10+ required"; exit 1; }
node -v | grep -E 'v1[8-9]\.|v20\.' || { echo "Node 18+ required"; exit 1; }
psql --version >/dev/null || { echo "Postgres client (psql) required"; exit 1; }

# ----------- Env -----------
if [ ! -f .env ]; then cp .env.example .env; fi

# ----------- Python venv -----------
if [ ! -d .venv ]; then python -m venv .venv; fi
source .venv/Scripts/activate
pip install -U pip
pip install -r backend/requirements.txt

# ----------- Node deps -----------
cd frontend
npm install
cd ..

# ----------- DB migrations -----------
alembic -c backend/alembic.ini upgrade head

# ----------- Start services -----------
# Backend
uvicorn backend/app.main:app --host 0.0.0.0 --port 8007 &
BACKEND_PID=$!
# Frontend
cd frontend
npm run dev -- --port 5179 &
FRONTEND_PID=$!
cd ..

# Wait for both processes; Ctrl‑C to stop
trap "kill $BACKEND_PID $FRONTEND_PID; exit 0" SIGINT SIGTERM
wait
