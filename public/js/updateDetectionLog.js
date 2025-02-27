export function updateDetectionLog(detections) {
  const logElement = document.getElementById("detection-log");
  if (!logElement) return;

  if (detections) {
    logElement.innerHTML = "";

    for (const [label, percentage] of Object.entries(detections)) {
      const percentageRounded = Math.floor(percentage);
      const detectionDiv = document.createElement("div");
      detectionDiv.textContent = `${label} ${percentageRounded}%`;
      detectionDiv.style.width = `${percentageRounded}%`;
      logElement.appendChild(detectionDiv);
    }
  } else {
    logElement.innerHTML = `<div>No objects detected</div>`;
  }
}
