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

- The frontend will be available at: [http://localhost:5174](http://localhost:5174)
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
