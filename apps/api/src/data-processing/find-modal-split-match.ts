import type { ModalSplitPercentages, TrafficFeature } from "../common";

/** Above this Euclidean distance (modal split space), the best match is treated as weak. */
export const MATCH_DISTANCE_WEAK_THRESHOLD = 20;

export type ClosestMatchesResult = {
	matches: TrafficFeature[] | null;
	noCloseMatch: boolean;
};

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

/** Return the 3 closest matches; if segmentIdsWithImage is set, skip matches without images. */
export function findClosestMatches(
	currentDetections: ModalSplitPercentages,
	fetchedTrafficData: TrafficFeature[],
	segmentIdsWithImage?: Set<number>,
): ClosestMatchesResult {
	if (!Array.isArray(fetchedTrafficData) || fetchedTrafficData.length === 0) {
		return { matches: null, noCloseMatch: false };
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

	// pick top 3 closest features; if segmentIdsWithImage is set, only include features that have an image
	if (segmentIdsWithImage) {
		const result: TrafficFeature[] = [];
		let firstReturnedDistance: number | null = null;
		for (const entry of featuresWithDistances) {
			if (result.length >= 3) {
				break;
			}
			if (segmentIdsWithImage.has(entry.feature.properties.segment_id)) {
				if (firstReturnedDistance === null) {
					firstReturnedDistance = entry.distance;
				}
				result.push(entry.feature);
			}
		}
		if (result.length === 0) {
			return { matches: null, noCloseMatch: false };
		}
		return {
			matches: result,
			noCloseMatch:
				firstReturnedDistance !== null &&
				firstReturnedDistance > MATCH_DISTANCE_WEAK_THRESHOLD,
		};
	}

	const top = featuresWithDistances.slice(0, 3);
	const matches = top.map((entry) => entry.feature);
	const bestDistance = top.length > 0 ? top[0].distance : null;
	return {
		matches,
		noCloseMatch:
			bestDistance !== null && bestDistance > MATCH_DISTANCE_WEAK_THRESHOLD,
	};
}
