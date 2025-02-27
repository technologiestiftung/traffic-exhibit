import { fetchCurrentTraffic } from "./js/fetchCurrentTraffic.js";
import { updateDetectionLog } from "./js/updateDetectionLog.js";
import { findClosestMatch } from "./js/trafficMatcher.js";
import { updateMatchingStreet } from "./js/updateMatchingStreet.js";

// Keep track of the latest detections globally
let latestDetections = null;

async function fetchDetections() {
  try {
    const response = await fetch("/api/detections");
    const dataTracked = await response.json();
    const data = {
      car: dataTracked.tesa || 50,
      bike: dataTracked.clip || 40,
      pedestrian: dataTracked["ear plug"] || 10,
    };
    latestDetections = data;
    updateDetectionLog(data);

    // After getting new detections, find and update the closest match
    await findAndDisplayMatch();
  } catch (err) {
    console.error("Error fetching detections:", err);
  }
}

// Combined function to fetch traffic data and find match
async function findAndDisplayMatch() {
  if (!latestDetections) return;

  try {
    const trafficData = await fetchCurrentTraffic();
    const closestMatch = findClosestMatch(latestDetections, trafficData);

    if (closestMatch) {
      const coordinates = closestMatch.geometry.coordinates[0][0];
      updateMatchingStreet(coordinates);
    }
  } catch (error) {
    console.error("Error finding and displaying match:", error);
  }
}

// Start the detection polling
setInterval(fetchDetections, 1000);

// Initial fetch to start the process
fetchDetections();
