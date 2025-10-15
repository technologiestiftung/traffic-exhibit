#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/home/roboter/Desktop/traffic-exhibit"
APP_URL="${APP_URL:-http://localhost:5173}"
export NPM_CONFIG_AUDIT=false
export NPM_CONFIG_FUND=false

wait_and_open() {
  for _ in {1..60}; do
    if command -v curl >/dev/null 2>&1 && curl -sSf "$APP_URL" >/dev/null 2>&1; then
      DISPLAY="${DISPLAY:-:0}" xdg-open "$APP_URL" >/dev/null 2>&1 &
      break
    fi
    sleep 2
  done
}

# 1) Process data
cd "$PROJECT_DIR/apps/api"
npm run process-data

# 2) Start background waiter to open browser
wait_and_open &

# 3) Change to project root and start server
cd "$PROJECT_DIR"
npm run dev &
echo "Waiting for dev server to start..."
sleep 10

# 4) Wait for dev server to start, then start hourly data processing in background
npm run process-data-hourly &
echo "Waiting for hourly data processing to start..."
sleep 10

# 5) Start button monitor (foreground - keeps service alive)
echo "Starting button monitor..."
cd "$PROJECT_DIR/apps/api"
npm run start-button-monitor
