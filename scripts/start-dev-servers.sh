#!/usr/bin/env bash
set -euo pipefail

# Start DexDraw dev servers for E2E testing with robust process monitoring.
# Ensures API is ready before client starts, monitors health during test run.

API_PORT=${API_PORT:-4000}
API_HOST=${API_HOST:-127.0.0.1}
CLIENT_PORT=${CLIENT_PORT:-5173}
CLIENT_HOST=${CLIENT_HOST:-127.0.0.1}
API_HEALTH_URL="http://${API_HOST}:${API_PORT}/health"
CLIENT_URL="http://${CLIENT_HOST}:${CLIENT_PORT}"
API_PROXY_URL="http://${CLIENT_HOST}:${CLIENT_PORT}/api/templates"

# Kill any stale processes on our ports before starting
kill_stale_processes() {
  for port in "$API_PORT" "$CLIENT_PORT"; do
    if lsof -i ":$port" &>/dev/null 2>&1; then
      echo "Killing stale processes on port $port..."
      lsof -ti ":$port" | xargs -r kill -9 2>/dev/null || true
      sleep 0.5
    fi
  done
}

cleanup() {
  echo "Shutting down dev servers..."
  # Kill child processes on exit
  if [[ -n "${API_PID:-}" ]]; then
    kill "$API_PID" 2>/dev/null || true
  fi
  if [[ -n "${CLIENT_PID:-}" ]]; then
    kill "$CLIENT_PID" 2>/dev/null || true
  fi
  # Wait for cleanup
  sleep 0.5
  # Force kill any remaining processes
  jobs -p | xargs -r kill -9 2>/dev/null || true
}

trap cleanup EXIT

echo "Starting DexDraw dev servers..."
echo "API: $API_HEALTH_URL"
echo "Client: $CLIENT_URL"
echo "Proxy check: $API_PROXY_URL"
echo ""

# Kill any stale processes
kill_stale_processes

# Clean database before E2E to avoid stale/locked state
DB_DIR="apps/server-api/.dexdraw-data"
if [[ -d "$DB_DIR" ]]; then
  echo "Cleaning database directory..."
  rm -rf "$DB_DIR"
fi

echo "Starting API server (port $API_PORT)..."
pnpm --filter @dexdraw/server-api dev &
API_PID=$!

# Wait for API health endpoint with timeout
echo "Waiting for API to be ready..."
TIMEOUT=30
ELAPSED=0
while ! curl -sf "$API_HEALTH_URL" > /dev/null 2>&1; do
  if [[ $ELAPSED -ge $TIMEOUT ]]; then
    echo "ERROR: API server failed to start within ${TIMEOUT}s"
    kill "$API_PID" 2>/dev/null || true
    exit 1
  fi
  # Check if API process is still alive
  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "ERROR: API server process exited unexpectedly"
    exit 1
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done
echo "API is ready after ${ELAPSED}s"

echo "Starting client server (port $CLIENT_PORT)..."
pnpm --filter @dexdraw/client-web dev -- --host "$CLIENT_HOST" --port "$CLIENT_PORT" &
CLIENT_PID=$!

# Wait for client with timeout
echo "Waiting for client to be ready..."
ELAPSED=0
while ! curl -sf "$CLIENT_URL" > /dev/null 2>&1; do
  if [[ $ELAPSED -ge $TIMEOUT ]]; then
    echo "ERROR: Client server failed to start within ${TIMEOUT}s"
    kill "$API_PID" "$CLIENT_PID" 2>/dev/null || true
    exit 1
  fi
  # Check if API is still alive
  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "ERROR: API server process exited unexpectedly during client startup"
    exit 1
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done
echo "Client is ready after ${ELAPSED}s"

# Verify that the Vite proxy to /api works (critical: ensures API is actually accessible through the client)
echo "Verifying Vite proxy to /api/templates..."
TIMEOUT=10
ELAPSED=0
while ! curl -sf "$API_PROXY_URL" > /dev/null 2>&1; do
  if [[ $ELAPSED -ge $TIMEOUT ]]; then
    echo "ERROR: Vite proxy to /api failed within ${TIMEOUT}s"
    kill "$API_PID" "$CLIENT_PID" 2>/dev/null || true
    exit 1
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done
echo "Vite proxy is working"

echo ""
echo "✅ Both servers are ready"
echo ""

# Monitor processes during test run
# If either process dies, exit immediately with error
monitor_processes() {
  while true; do
    if ! kill -0 "$API_PID" 2>/dev/null; then
      echo "ERROR: API server process exited unexpectedly"
      kill "$CLIENT_PID" 2>/dev/null || true
      exit 1
    fi
    if ! kill -0 "$CLIENT_PID" 2>/dev/null; then
      echo "ERROR: Client server process exited unexpectedly"
      kill "$API_PID" 2>/dev/null || true
      exit 1
    fi
    sleep 2
  done
}

# Start monitoring in background
monitor_processes &
MONITOR_PID=$!

# Keep servers running
wait "$API_PID" "$CLIENT_PID"
