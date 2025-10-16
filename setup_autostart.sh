#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/home/roboter/Desktop/traffic-exhibit"
APP_URL="${APP_URL:-http://localhost:5173}"
export NPM_CONFIG_AUDIT=false
export NPM_CONFIG_FUND=false

wait_and_open() {
  # Allow overriding the chromium binary and flags via env vars.
  # Always launch in fullscreen app mode (no kiosk toggle).
  CHROMIUM_BIN="${CHROMIUM_BIN:-chromium-browser}"
  DEFAULT_FLAGS="--start-fullscreen --app=$APP_URL --noerrdialogs --disable-infobars --disable-session-crashed-bubble --disable-features=Translate,ChromiumBoringSSL"
  BROWSER_FLAGS="${BROWSER_FLAGS:-$DEFAULT_FLAGS}"

# Wait up to 2 minutes for the app URL to be available
  echo "Waiting for $APP_URL to be available..."
  # Try every 2 seconds for up to 2 minutes
  for _ in {1..60}; do
    # Use curl to check if the URL is reachable 
    if command -v curl >/dev/null 2>&1 && curl -sSf "$APP_URL" >/dev/null 2>&1; then
      # URL is reachable, open in browser
      if command -v "$CHROMIUM_BIN" >/dev/null 2>&1; then
        echo "Opening $APP_URL in Chromium ($CHROMIUM_BIN) with flags: $BROWSER_FLAGS"
        DISPLAY="${DISPLAY:-:0}" "$CHROMIUM_BIN" $BROWSER_FLAGS "$APP_URL" >/dev/null 2>&1 &
      else
        # Fallback to xdg-open if Chromium is not found
        echo "Chromium not found (looked for $CHROMIUM_BIN). Falling back to xdg-open."
        DISPLAY="${DISPLAY:-:0}" xdg-open "$APP_URL" >/dev/null 2>&1 &
      fi
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
