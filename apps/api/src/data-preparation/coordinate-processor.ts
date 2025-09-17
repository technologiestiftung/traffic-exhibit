import type { Coordinates } from "../common";
import { findWorstIndexForCoordinates } from "./air-quality-service";
import { getNewestImageForCoordinates } from "./image-service";
import { checkBikeLaneOverlap } from "./bike-lane-service";
import { fetchNearestNoiseLevelForCoordinates } from "./noise-service";

/**
 * Comprehensive data processor that takes a single coordinates array
 * and processes it through all available services
 */
export async function processCoordinatesData(coordinates: Coordinates[]) {
	if (coordinates.length === 0) {
		throw new Error("No coordinates provided");
	}

	// All functions now accept the same Coordinates[] format
	const [airQuality, image, bikeLanes, noise] = await Promise.allSettled([
		// Air quality uses first coordinate
		Promise.resolve(findWorstIndexForCoordinates(coordinates)),
		// Image search uses bounding box from all coordinates
		getNewestImageForCoordinates(coordinates),
		// Bike lanes uses all coordinates for route analysis
		checkBikeLaneOverlap(coordinates),
		// Noise uses first coordinate
		fetchNearestNoiseLevelForCoordinates(coordinates),
	]);

	return {
		airQuality: airQuality.status === "fulfilled" ? airQuality.value : null,
		image: image.status === "fulfilled" ? image.value : null,
		bikeLanes: bikeLanes.status === "fulfilled" ? bikeLanes.value : null,
		noise: noise.status === "fulfilled" ? noise.value : null,
		coordinatesUsed: coordinates,
		processingNote: {
			airQuality: "Uses first coordinate",
			image: "Uses bounding box from all coordinates",
			bikeLanes: "Uses all coordinates for route analysis",
			noise: "Uses first coordinate",
		},
	};
}

/**
 * Example usage demonstrating the unified coordinate interface
 */
export async function exampleUsage() {
	// Single coordinate array that works for all services
	const coordinates: Coordinates[] = [
		{ lon: 13.387929865667388, lat: 52.483641481858655 },
		{ lon: 13.388140899999883, lat: 52.48398972106418 },
		{ lon: 13.388161322677405, lat: 52.48430271942601 },
	];

	try {
		const result = await processCoordinatesData(coordinates);
		// eslint-disable-next-line no-console
		console.log("Comprehensive data result:", result);
		return result;
	} catch (error) {
		console.error("Error processing coordinates:", error);
		return null;
	}
}
