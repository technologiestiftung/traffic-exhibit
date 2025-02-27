const express = require("express");
const axios = require("axios");
const app = express();
const port = 3000;

// Serve static files from the 'public' folder
app.use(express.static("public"));

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

app.listen(port, () => {
  console.log(`Node server running on port ${port}`);
});
