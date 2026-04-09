#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

cleanup() {
  if [[ -n "${CONVEX_PID:-}" ]] && kill -0 "$CONVEX_PID" 2>/dev/null; then
    kill "$CONVEX_PID" 2>/dev/null || true
  fi

  if [[ -n "${WEB_PID:-}" ]] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting Convex dev in apps/web"
(cd "$ROOT_DIR/apps/web" && bun run dev:convex) &
CONVEX_PID=$!

echo "Starting web on http://localhost:5173"
(cd "$ROOT_DIR/apps/web" && bun run dev) &
WEB_PID=$!

wait "$CONVEX_PID" "$WEB_PID"
