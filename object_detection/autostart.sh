#!/bin/bash
# Change to the app directory
cd /home/pi/traffic-exhibit

# Activate virtual environment
source venv/bin/activate

# Start the Python backend in the background
nohup python3 object-detection/object-detection.py > object-detection/object-detection.log 2>&1 &

# Start the Node server in the background
nohup node index.js > node_server.log 2>&1 &

# TO DO

#1.
# chmod +x /home/pi/my-app/autostart.sh

# Schedule the Script to Run at Boot
# You can use either systemd or crontab for this.

#2.
# Using systemd: Create a service file /etc/systemd/system/my-app.service:

#     [Unit]
#     Description=Start YOLO Object Detection App
#     After=network.target

    # [Service]
    # WorkingDirectory=/home/pi/my-app
    # ExecStart=/home/pi/my-app/venv/bin/python /home/pi/my-app/python_backend.py
    # Restart=always
    # User=pi

#     [Install]
#     WantedBy=multi-user.target

# 3. Then reload and enable the service:

# bash
# sudo systemctl daemon-reload
# sudo systemctl enable my-app.service
# sudo systemctl start my-app.service