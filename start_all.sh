#!/usr/bin/env bash
set -euo pipefail

# Traffic Exhibit – start all processes
# Runs process-data, dev server, yolo-detect, and button monitor.
# Opens the app in the browser (normal window, not kiosk). Set OPEN_BROWSER=0 to skip.
#
# Usage: ./start_all.sh

# Project root (directory containing this script)
PROJECT_DIR="${PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
APP_URL="${APP_URL:-http://localhost:5173}"
OPEN_BROWSER="${OPEN_BROWSER:-1}"

export NPM_CONFIG_AUDIT=false
export NPM_CONFIG_FUND=false

wait_and_open() {
  if [ -z "${CHROMIUM_BIN:-}" ]; then
    for bin in chromium chromium-browser google-chrome google-chrome-stable; do
      if command -v "$bin" >/dev/null 2>&1; then
        CHROMIUM_BIN="$bin"
        break
      fi
    done
  fi

  # Normal window (no kiosk). Override with BROWSER_FLAGS if needed.
  DEFAULT_FLAGS="--noerrdialogs --disable-infobars --disable-session-crashed-bubble --disable-features=Translate,ChromiumBoringSSL"
  BROWSER_FLAGS="${BROWSER_FLAGS:-$DEFAULT_FLAGS}"

  echo "Waiting for $APP_URL to be available..."
  for _ in {1..60}; do
    if command -v curl >/dev/null 2>&1 && curl -sSf "$APP_URL" >/dev/null 2>&1; then
      if [ -n "${CHROMIUM_BIN:-}" ] && command -v "$CHROMIUM_BIN" >/dev/null 2>&1; then
        echo "Opening $APP_URL in $CHROMIUM_BIN"
        DISPLAY="${DISPLAY:-:0}" "$CHROMIUM_BIN" $BROWSER_FLAGS "$APP_URL" >/dev/null 2>&1 &
      else
        echo "Chromium not found. Falling back to xdg-open."
        DISPLAY="${DISPLAY:-:0}" xdg-open "$APP_URL" >/dev/null 2>&1 &
      fi
      break
    fi
    sleep 2
  done
}

echo "Project directory: $PROJECT_DIR"

# 1) Process data
echo "Running initial process-data..."
cd "$PROJECT_DIR/apps/api"
npm run process-data

# 2) Optional: start background waiter to open browser
if [ "$OPEN_BROWSER" = "1" ]; then
  wait_and_open &
fi

# 3) Start dev server
cd "$PROJECT_DIR"
npm run dev &
echo "Waiting for dev server to start..."
sleep 10

# 4) Start yolo detect
echo "Starting yolo detect..."
cd "$PROJECT_DIR/apps/api"
npm run yolo-detect &
sleep 15

# 5) Start button monitor (runs in foreground; use Ctrl+C to stop all)
echo "Starting button monitor..."
npm run start-button-monitor
