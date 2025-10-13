import type { ModalSplitPercentages, TrafficFeature } from "../common";

function calculateDistance(
	dist1: ModalSplitPercentages,
	dist2: ModalSplitPercentages,
): number {
	const carDiff = (dist1.car ?? 0) - (dist2.car ?? 0);
	const bikeDiff = (dist1.bike ?? 0) - (dist2.bike ?? 0);
	const pedDiff = (dist1.pedestrian ?? 0) - (dist2.pedestrian ?? 0);
	const heavyDiff = (dist1.heavy ?? 0) - (dist2.heavy ?? 0);

	return Math.sqrt(
		carDiff * carDiff +
			bikeDiff * bikeDiff +
			pedDiff * pedDiff +
			heavyDiff * heavyDiff,
	);
}

/** Return the 3 closest matches (smallest distance → largest). */
export function findClosestMatches(
	currentDetections: ModalSplitPercentages,
	fetchedTrafficData: TrafficFeature[],
): TrafficFeature[] | null {
	if (!Array.isArray(fetchedTrafficData) || fetchedTrafficData.length === 0) {
		return null;
	}

	// compute distances for each feature relative to current detections
	const featuresWithDistances = fetchedTrafficData.map((feature, idx) => {
		const featureData: ModalSplitPercentages = {
			car: feature?.properties?.car_percentage ?? 0,
			bike: feature?.properties?.bike_percentage ?? 0,
			pedestrian: feature?.properties?.pedestrian_percentage ?? 0,
			heavy: feature?.properties?.heavy_percentage ?? 0,
		};

		const distance = calculateDistance(currentDetections, featureData);

		return { feature, distance, idx }; // idx ensures stable tie-break
	});

	// sort ascending by distance (stable via idx tie-break)
	featuresWithDistances.sort((featureA, featureB) =>
		featureA.distance === featureB.distance
			? featureA.idx - featureB.idx
			: featureA.distance - featureB.distance,
	);

	// pick top 3 closest features
	return featuresWithDistances.slice(0, 3).map((entry) => entry.feature);
}
