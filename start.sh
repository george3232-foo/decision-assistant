#!/bin/bash
# Decision Assistant — Start Script
# Usage: ./start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

echo "🧠 Decision Assistant"
echo "====================="
echo ""

# Check venv
if [ ! -d "$BACKEND_DIR/.venv" ]; then
  echo "📦 Creating virtual environment..."
  cd "$BACKEND_DIR"
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
else
  source "$BACKEND_DIR/.venv/bin/activate"
fi

# Kill existing
fuser -k 8000/tcp 2>/dev/null || true
sleep 1

echo "🚀 Starting server on http://localhost:8000"
echo "   Frontend: http://localhost:8000"
echo "   API docs: http://localhost:8000/docs"
echo ""

cd "$BACKEND_DIR"
exec uvicorn main:app --host 0.0.0.0 --port 8000
