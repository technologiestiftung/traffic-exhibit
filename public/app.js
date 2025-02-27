async function fetchDetections() {
  try {
    const response = await fetch("/api/detections");
    const data = await response.json();
    updateDetectionLog(data);
    updateDetectionLog(data);
  } catch (err) {
    console.error("Error fetching detections:", err);
  }
}

function updateDetectionLog(detections) {
  const logElement = document.getElementById("detection-log");

  if (detections) {
    // Clear previously tracked elements
    logElement.innerHTML = "";

    // Create a new div for each detected element
    for (const [label, percentage] of Object.entries(detections)) {
      const percentageRounded = Math.floor(percentage);
      const detectionDiv = document.createElement("div");
      detectionDiv.textContent = `${label} ${percentageRounded}%`;

      // Use percentageRounded as the width in percentage
      detectionDiv.style.width = `${percentageRounded}%`;

      logElement.appendChild(detectionDiv);
    }
  } else {
    logElement.innerHTML = `<div>No objects detected</div>`;
  }
}

// Poll the detections endpoint every 500ms
setInterval(fetchDetections, 1000);
