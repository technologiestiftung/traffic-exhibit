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
http://localhost:5174
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
