#!/usr/bin/env bash
set -euo pipefail

# Start DexDraw dev servers for E2E testing
# Ensures API is ready before client starts, avoiding proxy ECONNREFUSED errors

API_PORT=${API_PORT:-4000}
API_HOST=${API_HOST:-127.0.0.1}
CLIENT_PORT=${CLIENT_PORT:-5173}
CLIENT_HOST=${CLIENT_HOST:-127.0.0.1}
API_HEALTH_URL="http://${API_HOST}:${API_PORT}/health"
CLIENT_URL="http://${CLIENT_HOST}:${CLIENT_PORT}"

cleanup() {
  echo "Shutting down dev servers..."
  # Kill child processes on exit
  jobs -p | xargs -r kill 2>/dev/null || true
}

trap cleanup EXIT

echo "Starting DexDraw dev servers..."
echo "API: $API_HEALTH_URL"
echo "Client: $CLIENT_URL"
echo ""

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
    kill $API_PID 2>/dev/null || true
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
    kill $API_PID $CLIENT_PID 2>/dev/null || true
    exit 1
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done
echo "Client is ready after ${ELAPSED}s"

echo ""
echo "✅ Both servers are ready"
echo ""

# Keep servers running
wait
