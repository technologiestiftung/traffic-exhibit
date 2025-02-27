function calculatePercentages(data) {
  const total = data.car + data.bike + data.pedestrian;
  return {
    car: (data.car / total) * 100,
    bike: (data.bike / total) * 100,
    pedestrian: (data.pedestrian / total) * 100,
  };
}

function calculateDistance(dist1, dist2) {
  const carDiff = dist1.car - dist2.car;
  const bikeDiff = dist1.bike - dist2.bike;
  const pedDiff = dist1.pedestrian - dist2.pedestrian;

  return Math.sqrt(carDiff * carDiff + bikeDiff * bikeDiff + pedDiff * pedDiff);
}

export function findClosestMatch(currentDetections, fetchedTrafficData) {
  if (!fetchedTrafficData?.length) return null;

  let closestMatch = fetchedTrafficData[0];
  let smallestDistance = Infinity;

  for (const feature of fetchedTrafficData) {
    const featureData = {
      car: feature.properties.car,
      bike: feature.properties.bike,
      pedestrian: feature.properties.pedestrian,
    };

    const featurePercentages = calculatePercentages(featureData);
    const distance = calculateDistance(currentDetections, featurePercentages);

    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestMatch = feature;
    }
  }

  return closestMatch;
}
