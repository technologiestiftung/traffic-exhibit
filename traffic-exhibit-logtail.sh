#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="${SERVICE_NAME:-traffic-exhibit}"
DELAY_SECS="${DELAY_SECS:-5}"

# small delay so desktop session is ready
sleep "$DELAY_SECS"

# breadcrumb for debugging
echo "Autostart logtail wrapper running at $(date) for service: $SERVICE_NAME" | systemd-cat -t traffic-exhibit-autostart

CMD='bash -lc "journalctl -fu '"$SERVICE_NAME"'"'

# try common terminals in order
if command -v lxterminal >/dev/null 2>&1; then
  exec lxterminal --command="$CMD"
elif command -v x-terminal-emulator >/dev/null 2>&1; then
  exec x-terminal-emulator -e "$CMD"
elif command -v xterm >/dev/null 2>&1; then
  exec xterm -hold -e bash -lc "journalctl -fu $SERVICE_NAME"
else
  echo "No terminal found (lxterminal/x-terminal-emulator/xterm). Install one." | systemd-cat -t traffic-exhibit-autostart
  exit 1
fi
