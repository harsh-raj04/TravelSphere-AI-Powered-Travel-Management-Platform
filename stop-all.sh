#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
COMPOSE_FILE="$BACKEND_DIR/docker-compose.yml"

stop_pid_file() {
  local pid_file="$1"
  local name="$2"

  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file")"

    if [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1; then
      echo "Stopping $name (PID $pid)..."
      kill "$pid" || true

      # Give the process a moment to exit before forcing.
      sleep 1
      if kill -0 "$pid" >/dev/null 2>&1; then
        kill -9 "$pid" || true
      fi
    fi

    rm -f "$pid_file"
  fi
}

kill_port_listener() {
  local port="$1"
  local name="$2"
  local pids

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "Force-stopping $name on port $port (PID(s): $pids)..."
    # shellcheck disable=SC2086
    kill $pids || true
    sleep 1
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
  fi
}

stop_pid_file "$ROOT_DIR/.backend.pid" "backend"
stop_pid_file "$ROOT_DIR/.customer.pid" "customer frontend"
stop_pid_file "$ROOT_DIR/.agent.pid" "agent frontend"
stop_pid_file "$ROOT_DIR/.admin.pid" "admin frontend"

# Backward compatibility with older PID naming.
stop_pid_file "$ROOT_DIR/.frontend.pid" "frontend"

# Fallback cleanup for orphaned local dev servers.
kill_port_listener 5000 "backend"
kill_port_listener 5100 "customer frontend"
kill_port_listener 5200 "agent frontend"
kill_port_listener 5300 "admin frontend"
kill_port_listener 5173 "frontend"
kill_port_listener 5174 "agent frontend"

if [[ -f "$COMPOSE_FILE" ]]; then
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo "Stopping database..."
    docker compose -f "$COMPOSE_FILE" down
  else
    echo "Docker daemon is not running; skipping database shutdown."
  fi
fi

echo "All services stopped."
