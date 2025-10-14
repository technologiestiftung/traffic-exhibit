#!/usr/bin/env bash
# This script opens a terminal showing traffic-exhibit logs
sleep 5  # Wait for desktop to be fully loaded
lxterminal --title="Traffic Exhibit Logs" --command="bash -c 'journalctl -fu traffic-exhibit.service -o cat; exec bash'"