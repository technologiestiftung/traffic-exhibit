export async function fetchCurrentTraffic() {
  try {
    const response = await fetch("/api/traffic", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    return json.features;
  } catch (error) {
    console.error("Error fetching traffic data:", error);
    throw error;
  }
}
