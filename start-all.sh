#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
COMPOSE_FILE="$BACKEND_DIR/docker-compose.yml"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is not installed or not in PATH."
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Could not find docker compose file at: $COMPOSE_FILE"
  exit 1
fi

# Install dependencies if missing.
if [[ ! -d "$BACKEND_DIR/node_modules" ]]; then
  echo "Installing backend dependencies..."
  (cd "$BACKEND_DIR" && npm install)
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "Installing frontend dependencies..."
  (cd "$FRONTEND_DIR" && npm install)
fi

echo "Starting backend (http://localhost:4000)..."
(
  cd "$BACKEND_DIR"
  nohup npm run dev > "$ROOT_DIR/.backend.log" 2>&1 &
  echo $! > "$ROOT_DIR/.backend.pid"
)

echo "Starting customer UI (http://localhost:5100)..."
(
  cd "$FRONTEND_DIR"
  nohup npm run dev:customer -- --host 0.0.0.0 > "$ROOT_DIR/.customer.log" 2>&1 &
  echo $! > "$ROOT_DIR/.customer.pid"
)

echo "Starting agent UI (http://localhost:5200)..."
(
  cd "$FRONTEND_DIR"
  nohup npm run dev:agent -- --host 0.0.0.0 > "$ROOT_DIR/.agent.log" 2>&1 &
  echo $! > "$ROOT_DIR/.agent.pid"
)

echo "Starting admin UI (http://localhost:5300)..."
(
  cd "$FRONTEND_DIR"
  nohup npm run dev:admin -- --host 0.0.0.0 > "$ROOT_DIR/.admin.log" 2>&1 &
  echo $! > "$ROOT_DIR/.admin.pid"
)

echo ""
echo "TravelSphere services started."
echo "Customer:   http://localhost:5100"
echo "Backend:    http://localhost:4000"
echo "Agent:      http://localhost:5200"
echo "Admin:      http://localhost:5300"

echo ""
echo "Logs:"
echo "  tail -f .backend.log"
echo "  tail -f .customer.log"
echo "  tail -f .agent.log"
echo "  tail -f .admin.log"
echo ""
echo "To stop all services: ./stop-all.sh"
