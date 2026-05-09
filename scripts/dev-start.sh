#!/bin/bash
# Echo Development Startup Script
# Starts both backend and frontend development servers

set -e

ECHO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ECHO_DIR/backend"
FRONTEND_DIR="$ECHO_DIR/frontend"

echo "================================================"
echo "  Echo - Pronunciation Practice App"
echo "  Starting development servers..."
echo "================================================"
echo ""

# Backend
echo "[1/2] Starting backend (FastAPI)..."
cd "$BACKEND_DIR"
source .venv/bin/activate
rm -f echo.db  # Fresh DB each dev session
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "       Backend: http://localhost:8000"
echo "       API docs: http://localhost:8000/docs"
echo "       Health:   http://localhost:8000/health"
echo "       PID: $BACKEND_PID"

sleep 2

# Check backend is running
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "       Status: running"
else
    echo "       Status: FAILED TO START - check $BACKEND_DIR/main.py"
    exit 1
fi

# Frontend
echo ""
echo "[2/2] Starting frontend (Vite)..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!
echo "       Frontend: http://localhost:5173"
echo "       PID: $FRONTEND_PID"
echo ""
echo "================================================"
echo "  Both servers running!"
echo "  Open: http://localhost:5173"
echo "================================================"
echo ""
echo "Press Ctrl+C to stop both servers"

# Trap Ctrl+C to kill both processes
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "Done."
    exit 0
}
trap cleanup SIGINT SIGTERM

# Wait for either process to exit
wait
