#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="/home/roboter/Desktop/traffic-exhibit"

# Optional: speed up noninteractive npm
export NPM_CONFIG_AUDIT=false
export NPM_CONFIG_FUND=false

# 1) Process Telraam data
cd "$PROJECT_DIR/apps/api"
npm run process-data

# 2) Start the app from the repo root (foreground)
cd "$PROJECT_DIR"
# If you need LAN access from other devices, uncomment:
# HOST=0.0.0.0 npm run dev
npm run dev
