const express = require("express");
const axios = require("axios");
const app = express();
const port = 3000;

// Serve static files from the 'public' folder
app.use(express.static("public"));
app.use(express.json()); // Add middleware to parse JSON bodies

// Configure response headers for ES modules
app.use((req, res, next) => {
  if (req.url.endsWith(".js")) {
    res.set("Content-Type", "application/javascript; charset=UTF-8");
    res.set("X-Content-Type-Options", "nosniff");
  }
  next();
});

// API endpoint that proxies detection data from the Python backend
app.get("/api/detections", async (req, res) => {
  try {
    const response = await axios.get("http://localhost:5000/detections");
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching detections:", error);
    res.status(500).json({ error: "Error fetching detections" });
  }
});

// API endpoint for traffic data from telraam
app.post("/api/traffic", async (req, res) => {
  const url = process.env.TELRAM_API_ENDPOINT;

  try {
    const response = await axios.post(
      url,
      {
        time: "live",
        contents: "minimal",
        area: "13.08,52.68,13.76,52.34", // Berlin
        // area: "13.08,52.68,13.4,52.54", // smaller area for testing
      },
      {
        headers: {
          "X-Api-Key": process.env.TELRAM_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Error fetching traffic data:", error);
    res.status(500).json({
      error: "Error fetching traffic data",
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Node server running on port ${port}`);
});
