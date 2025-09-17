import type { ModalSplitPercentages, TrafficFeature } from "../common";

function calculateDistance(
	dist1: ModalSplitPercentages,
	dist2: ModalSplitPercentages,
): number {
	const carDiff = dist1.car - dist2.car;
	const bikeDiff = dist1.bike - dist2.bike;
	const pedDiff = dist1.pedestrian - dist2.pedestrian;
	const heavyDiff = dist1.heavy - dist2.heavy;

	return Math.sqrt(
		carDiff * carDiff +
			bikeDiff * bikeDiff +
			pedDiff * pedDiff +
			heavyDiff * heavyDiff,
	);
}

export function findClosestMatch(
	currentDetections: ModalSplitPercentages,
	fetchedTrafficData: TrafficFeature[],
): TrafficFeature | null {
	if (!fetchedTrafficData?.length) return null;

	let closestMatch = fetchedTrafficData[0];
	let smallestDistance = Infinity;

	for (const feature of fetchedTrafficData) {
		const featureData: ModalSplitPercentages = {
			car: feature.properties.car_percentage,
			bike: feature.properties.bike_percentage,
			pedestrian: feature.properties.pedestrian_percentage,
			heavy: feature.properties.heavy_percentage,
		};

		const distance = calculateDistance(currentDetections, featureData);

		if (distance < smallestDistance) {
			smallestDistance = distance;
			closestMatch = feature;
		}
	}
	console.log(closestMatch);
	return closestMatch;
}
