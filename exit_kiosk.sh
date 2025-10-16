#!/usr/bin/env bash

# Traffic Exhibit Kiosk Exit Helper
# This script provides multiple ways to exit the kiosk mode

echo "Traffic Exhibit - Kiosk Exit Helper"
echo "==================================="
echo ""
echo "Choose an exit method:"
echo "1) Kill Chromium browser (recommended)"
echo "2) Kill entire traffic exhibit"
echo "3) Show keyboard shortcuts"
echo "4) Cancel"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "Killing Chromium browser..."
        pkill -f chromium 2>/dev/null && echo "✅ Chromium closed successfully" || echo "❌ No Chromium process found"
        ;;
    2)
        echo "Stopping traffic exhibit service..."
        if systemctl is-active --quiet traffic-exhibit; then
            sudo systemctl stop traffic-exhibit
            echo "✅ Traffic exhibit service stopped"
        else
            echo "Killing all traffic exhibit processes..."
            pkill -f "traffic-exhibit\|node.*dev\|python.*button_monitor" 2>/dev/null
            echo "✅ Processes terminated"
        fi
        ;;
    3)
        echo ""
        echo "Keyboard shortcuts to exit kiosk mode:"
        echo "• Ctrl+Shift+Q - Quit Chromium"
        echo "• Alt+F4 - Close window"
        echo "• Ctrl+Alt+T - Open terminal (then run 'pkill chromium')"
        echo "• F11 - Toggle fullscreen (may not work in kiosk)"
        echo ""
        ;;
    4)
        echo "Cancelled."
        ;;
    *)
        echo "Invalid choice. Cancelled."
        ;;
esac