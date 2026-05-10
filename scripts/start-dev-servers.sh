#!/usr/bin/env bash
set -euo pipefail

# Start DexDraw dev servers for E2E testing with robust process monitoring.
# Uses temp directory for E2E data to avoid iCloud file locking issues.
# Ensures API is ready before client starts, monitors health during test run.

API_PORT=${API_PORT:-4000}
API_HOST=${API_HOST:-127.0.0.1}
CLIENT_PORT=${CLIENT_PORT:-5173}
CLIENT_HOST=${CLIENT_HOST:-127.0.0.1}
E2E_DATA_DIR=${DEXDRAW_DATA_DIR:-/tmp/dexdraw-e2e-data}
API_HEALTH_URL="http://${API_HOST}:${API_PORT}/health"
CLIENT_URL="http://${CLIENT_HOST}:${CLIENT_PORT}"
API_PROXY_URL="http://${CLIENT_HOST}:${CLIENT_PORT}/api/templates"

kill_pid_list() {
  if [[ $# -eq 0 ]]; then
    return 0
  fi
  kill -9 "$@" 2>/dev/null || true
}

pids_on_port() {
  local port="$1"
  lsof -ti TCP:"$port" 2>/dev/null || true
}

kill_port_processes() {
  local port="$1"
  local pids
  pids=$(pids_on_port "$port")
  if [[ -n "$pids" ]]; then
    echo "Killing stale processes on port $port..."
    # shellcheck disable=SC2086
    kill_pid_list $pids
    sleep 0.5
  fi
}

# Kill any stale processes on our ports before starting
kill_stale_processes() {
  kill_port_processes "$API_PORT"
  kill_port_processes "$CLIENT_PORT"
}

cleanup() {
  echo "Shutting down dev servers..."
  # Kill child processes on exit
  if [[ -n "${MONITOR_PID:-}" ]]; then
    kill "$MONITOR_PID" 2>/dev/null || true
  fi
  if [[ -n "${API_PID:-}" ]]; then
    kill "$API_PID" 2>/dev/null || true
  fi
  if [[ -n "${CLIENT_PID:-}" ]]; then
    kill "$CLIENT_PID" 2>/dev/null || true
  fi
  # Wait for cleanup
  sleep 0.5
  # Force kill any remaining background jobs.
  local job_pids
  job_pids=$(jobs -p || true)
  if [[ -n "$job_pids" ]]; then
    # shellcheck disable=SC2086
    kill_pid_list $job_pids
  fi
}

trap cleanup EXIT

echo "Starting DexDraw dev servers..."
echo "API: $API_HEALTH_URL"
echo "Client: $CLIENT_URL"
echo "E2E data dir: $E2E_DATA_DIR"
echo "Proxy check: $API_PROXY_URL"
echo ""

# Kill any stale processes
kill_stale_processes

# Clean E2E database directory before starting
echo "Preparing E2E environment..."
if [[ -d "$E2E_DATA_DIR" ]]; then
  echo "Removing stale E2E data directory..."
  rm -rf "$E2E_DATA_DIR"
fi
mkdir -p "$E2E_DATA_DIR"

echo "Starting API server (port $API_PORT)..."
DEXDRAW_DATA_DIR="$E2E_DATA_DIR" pnpm --filter @dexdraw/server-api dev &
API_PID=$!

# Wait for API health endpoint with timeout
echo "Waiting for API to be ready..."
TIMEOUT=45
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
# pnpm run-script in this workspace passes the separator literally here, so do
# not use an extra "--". Binding Vite to 127.0.0.1 keeps it aligned with the
# readiness probe and Playwright baseURL instead of macOS resolving to [::1].
pnpm --filter @dexdraw/client-web dev --host "$CLIENT_HOST" --port "$CLIENT_PORT" &
CLIENT_PID=$!

# Wait for client with timeout
echo "Waiting for client to be ready..."
TIMEOUT=45
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
TIMEOUT=15
ELAPSED=0
while ! curl -sf "$API_PROXY_URL" > /dev/null 2>&1; do
  if [[ $ELAPSED -ge $TIMEOUT ]]; then
    echo "ERROR: Vite proxy to /api failed within ${TIMEOUT}s"
    kill "$API_PID" "$CLIENT_PID" 2>/dev/null || true
    exit 1
  fi
  # Check if both servers are still alive
  if ! kill -0 "$API_PID" 2>/dev/null; then
    echo "ERROR: API server died during proxy verification"
    kill "$CLIENT_PID" 2>/dev/null || true
    exit 1
  fi
  if ! kill -0 "$CLIENT_PID" 2>/dev/null; then
    echo "ERROR: Client server died during proxy verification"
    kill "$API_PID" 2>/dev/null || true
    exit 1
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done
echo "Vite proxy is working"

echo ""
echo "✅ Both servers are ready (API at $API_HOST:$API_PORT, Client at $CLIENT_HOST:$CLIENT_PORT)"
echo ""

# Monitor processes during test run
# If either process dies, exit immediately with error
monitor_processes() {
  while true; do
    if ! kill -0 "$API_PID" 2>/dev/null; then
      echo "ERROR: API server process exited unexpectedly during test run"
      kill "$CLIENT_PID" 2>/dev/null || true
      exit 1
    fi
    if ! kill -0 "$CLIENT_PID" 2>/dev/null; then
      echo "ERROR: Client server process exited unexpectedly during test run"
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
