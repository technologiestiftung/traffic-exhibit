import type { ModalSplitPercentages, TrafficFeature } from "../common";

function calculateDistance(
	dist1: ModalSplitPercentages,
	dist2: ModalSplitPercentages,
): number {
	const carDiff = dist1.car - dist2.car;
	const bikeDiff = dist1.bike - dist2.bike;
	const pedDiff = dist1.pedestrian - dist2.pedestrian;
	const heavyDiff = dist1.heavy - (dist2.heavy ?? 0);

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
	const featuresWithDistances = fetchedTrafficData
		.map((feature, idx) => {
			if (!feature?.properties) {
				return null;
			}

			const featureData: ModalSplitPercentages = {
				car: feature.properties.car_percentage,
				bike: feature.properties.bike_percentage,
				pedestrian: feature.properties.pedestrian_percentage,
				heavy: feature.properties.heavy_percentage,
			};

			const distance = calculateDistance(currentDetections, featureData);

			return { feature, distance, idx }; // idx ensures stable tie-break
		})
		.filter((entry) => entry !== null); // remove any nulls

	// sort by distance ascending (closest first)
	featuresWithDistances.sort((featureA, featureB) =>
		featureA.distance === featureB.distance
			? featureA.idx - featureB.idx
			: featureA.distance - featureB.distance,
	);

	// pick top 3 closest features
	return featuresWithDistances.slice(0, 3).map((entry) => entry.feature);
}
