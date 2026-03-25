#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  if [[ -n "${API_PID:-}" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi

  if [[ -n "${WEB_PID:-}" ]] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting API on http://localhost:3000"
(cd "$ROOT_DIR/apps/api" && bun run dev) &
API_PID=$!

echo "Starting web on http://localhost:5173"
(cd "$ROOT_DIR/apps/web" && bun run dev) &
WEB_PID=$!

wait "$API_PID" "$WEB_PID"
