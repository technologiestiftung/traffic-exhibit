![](https://img.shields.io/badge/Built%20with%20%E2%9D%A4%EF%B8%8F-at%20Technologiestiftung%20Berlin-blue)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

# Traffic Exhibit

## **Project Structure**

```
traffic-exhibit/
├── apps/
│   ├── web-app/       # React + Vite + TypeScript frontend
│   └── api/           # Node.js + WebSocket backend + Python scripts
├── package.json       # Root package.json for npm workspaces
└── README.md
```

## Installation

Run the following command in the **root directory** to install dependencies for all workspaces:

```bash
npm install
```

## Usage or Deployment

### **1. Run the Project Locally**

In the **root directory**, start both the frontend and backend:

```bash
npm run dev
```

- The frontend will be available at: [http://localhost:5173](http://localhost:5173)
- The backend WebSocket server will run on: [http://localhost:3001](http://localhost:3001)

### **2. Access the Application**

Open your browser and navigate to:

```
http://localhost:5173
```

## Development

### **1. Frontend Development**

- The frontend is built with **React**, **Vite**, and **TypeScript**.
- WebSocket communication is handled via `socket.io-client`.
- Edit files in `apps/web-app/src/` and save to see changes reflected in the browser.

### **2. Backend Development**

- The backend uses **Node.js**, **Express**, and **WebSocket** (`socket.io`).
- Python scripts are called using Node.js' `child_process`.
- Edit files in `apps/api/src/` and restart the backend to see changes.

### **3. Python Integration**

- Python scripts for camera and motor control are located in `apps/api/scripts/`.
- Ensure scripts are executable:
  ```bash
  chmod +x apps/api/scripts/*.py
  ```

## Data Processing

The project includes automated data processing capabilities to enrich traffic data with additional environmental and infrastructure information.

### **Running Data Processing**

To process and enrich Telraam traffic data, run:

```bash
npm run process-data
```

This command executes the data processing pipeline which:

1. **Fetches fresh Telraam data** - Retrieves real-time traffic counting data from Telraam sensors
2. **Enriches with environmental data**:
   - **Air Quality**: Adds air quality measurements for each traffic segment
   - **Street Images**: Fetches relevant street view images for visualization
   - **Bike Lane Information**: Identifies overlapping bike lane types and infrastructure
   - **Noise Levels**: Retrieves nearest noise level measurements
   - **Address & District**: Performs reverse geocoding to get location details

### **Output**

The processed data is saved as `enriched-telraam-data.json` in the `apps/api/data/` directory, containing:

- Original traffic count data (cars, bikes, pedestrians, heavy vehicles)
- Geographic coordinates and segment information
- Environmental context (air quality, noise levels)
- Infrastructure details (bike lanes, addresses, districts)
- Associated street imagery URLs

### **Data Matching & Real-time Processing**

The system also includes intelligent traffic pattern matching functionality:

1. **Modal Split Detection**: Real-time detection of traffic composition (percentages of cars, bikes, pedestrians, heavy vehicles)
2. **Pattern Matching**: Uses Euclidean distance calculation to find the closest match between current detections and historical Telraam data
3. **Data Enrichment**: Matches the closest traffic pattern with the corresponding enriched dataset
4. **Frontend Integration**: Sends the matched enriched data to the frontend via WebSocket for real-time visualization

## Tests

tbd...

## Autostart Setup

To automatically start the Traffic Exhibit application when the Raspberry Pi boots up, use the provided systemd services and autostart configuration.

### Installation

1. **Transfer the project files** to your Raspberry Pi at `/home/roboter/Desktop/traffic-exhibit/`

2. **Make scripts executable**:
   ```bash
   cd /home/roboter/Desktop/traffic-exhibit/
   chmod +x setup_autostart.sh
   chmod +x open_logs_terminal.sh
   ```

3. **Install the systemd service**:
   ```bash
   sudo cp traffic-exhibit.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable traffic-exhibit.service
   ```

4. **The desktop logs terminal is already configured** via the autostart entry at `~/.config/autostart/traffic-exhibit-logs.desktop`

5. **Reboot to test** the autostart functionality:
   ```bash
   sudo reboot
   ```

### What Happens on Boot

After reboot, the system will automatically:

1. **Start the service**: The `traffic-exhibit.service` runs in the background, processing Telraam data and starting the development server
2. **Open logs terminal**: A terminal window titled "Traffic Exhibit Logs" automatically opens on the desktop showing live service logs
3. **Launch browser**: The application opens in your default browser at http://localhost:5173

### Management Commands

Once setup is complete, you can manage the service manually using:

- **Start**: `sudo systemctl start traffic-exhibit.service`
- **Stop**: `sudo systemctl stop traffic-exhibit.service`
- **Restart**: `sudo systemctl restart traffic-exhibit.service`
- **Status**: `sudo systemctl status traffic-exhibit.service`
- **View logs**: `sudo journalctl -u traffic-exhibit.service -f`
- **Enable autostart**: `sudo systemctl enable traffic-exhibit.service`
- **Disable autostart**: `sudo systemctl disable traffic-exhibit.service`

### Logs Terminal

The logs terminal will automatically open when you log into the desktop. If you need to open it manually:

```bash
/home/roboter/Desktop/traffic-exhibit/open_logs_terminal.sh
```

### Troubleshooting

If you need to manually stop the autostarted processes:

```bash
# Kill the development servers
kill -INT $(lsof -t -i :3001)
kill -INT $(lsof -t -i :5173)

# Or stop the entire service
sudo systemctl stop traffic-exhibit.service
```

To disable the logs terminal from opening automatically, remove or rename the autostart file:

```bash
mv ~/.config/autostart/traffic-exhibit-logs.desktop ~/.config/autostart/traffic-exhibit-logs.desktop.disabled
```

### Updating Autostart Components

Different parts of the autostart setup have different update procedures:

#### Automatically Updated (No Manual Steps Required):
- **`setup_autostart.sh`** - Changes are picked up automatically since the service references the file directly from your project directory
- **`open_logs_terminal.sh`** - Changes are picked up automatically since the desktop autostart references the file directly
- **Application code** - Any changes to your app code in `apps/` are automatically available

#### Manually Updated (Requires System Commands):
- **`traffic-exhibit.service`** - Must be copied to systemd and daemon reloaded:
  ```bash
  sudo cp traffic-exhibit.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl restart traffic-exhibit.service  # optional, to restart immediately
  ```

- **Desktop autostart configuration** - The file `~/.config/autostart/traffic-exhibit-logs.desktop` must be updated manually if you need to change the autostart behavior

#### Summary:
- ✅ **Scripts and app code**: Update automatically
- ❌ **Service files and autostart config**: Require manual system updates

## Contributing

Before you create a pull request, write an issue so we can discuss your changes.

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## Content Licensing

Texts and content available as [CC BY](https://creativecommons.org/licenses/by/3.0/de/).

## Credits

<table>
  <tr>
    <td>
      Made by <a href="https://citylab-berlin.org/de/start/">
        <br />
        <br />
        <img width="200" src="https://logos.citylab-berlin.org/logo-citylab-color.svg" alt="Link to the CityLAB Berlin website" />
      </a>
    </td>
    <td>
      A project by <a href="https://www.technologiestiftung-berlin.de/">
        <br />
        <br />
        <img width="150" src="https://logos.citylab-berlin.org/logo-technologiestiftung-berlin-de.svg" alt="Link to the Technologiestiftung Berlin website" />
      </a>
    </td>
    <td>
      Supported by <a href="https://www.berlin.de/rbmskzl/">
        <br />
        <br />
        <img width="80" src="https://logos.citylab-berlin.org/logo-berlin-senatskanzelei-de.svg" alt="Link to the Senate Chancellery of Berlin"/>
      </a>
    </td>
  </tr>
</table>

## Related Projects
