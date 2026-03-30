#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
COMPOSE_FILE="$BACKEND_DIR/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed or not in PATH."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not installed or not in PATH."
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Could not find docker compose file at: $COMPOSE_FILE"
  exit 1
fi

echo "Starting database..."
docker compose -f "$COMPOSE_FILE" up -d

# Install dependencies if missing.
if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
  echo "Installing backend dependencies..."
  (cd "$BACKEND_DIR" && npm install)
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "Installing frontend dependencies..."
  (cd "$FRONTEND_DIR" && npm install)
fi

echo "Starting backend (http://localhost:5000)..."
(
  cd "$BACKEND_DIR"
  nohup npm run dev > "$ROOT_DIR/.backend.log" 2>&1 &
  echo $! > "$ROOT_DIR/.backend.pid"
)

echo "Starting frontend main app (http://localhost:5173)..."
(
  cd "$FRONTEND_DIR"
  nohup npm run dev > "$ROOT_DIR/.frontend.log" 2>&1 &
  echo $! > "$ROOT_DIR/.frontend.pid"
)

echo "Starting agent app (http://localhost:5174)..."
(
  cd "$FRONTEND_DIR"
  nohup npm run dev:agent > "$ROOT_DIR/.agent.log" 2>&1 &
  echo $! > "$ROOT_DIR/.agent.pid"
)

echo ""
echo "TravelSphere services started."
echo "Main app:   http://localhost:5173"
echo "Backend:    http://localhost:5000"
echo "Agent app:  http://localhost:5174"

echo ""
echo "Logs:"
echo "  tail -f .backend.log"
echo "  tail -f .frontend.log"
echo "  tail -f .agent.log"
echo ""
echo "To stop all services: ./stop-all.sh"
