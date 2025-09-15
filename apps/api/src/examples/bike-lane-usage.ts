import {
	checkBikeLaneOverlap,
	handleBikeLaneRequest,
	handleBikeLaneBatch,
} from "../data-preparation/bike-lane.js";

/**
 * Example usage of the bike lane overlap checking functionality
 */

// Example 1: Check a single route for bike lane overlap
async function exampleSingleRoute() {
	const route = {
		startCoord: { lat: 52.52, lon: 13.405 }, // Brandenburg Gate area
		endCoord: { lat: 52.517, lon: 13.3889 }, // Potsdamer Platz area
	};

	try {
		const result = await checkBikeLaneOverlap(route);
		console.log("Single route overlap result:", {
			overlaps: result.overlaps,
			overlapRatio: `${(result.overlapRatio * 100).toFixed(1)}%`,
			distance_m: result.distance_m,
			matchingFeatures: result.matchingFeatures.length,
			note: result.note,
		});
	} catch (error) {
		console.error("Error checking bike lane overlap:", error);
	}
}

// Example 2: Check multiple routes in batch
async function exampleBatchRoutes() {
	const routes = [
		{
			startCoord: { lat: 52.52, lon: 13.405 }, // Brandenburg Gate to Potsdamer Platz
			endCoord: { lat: 52.517, lon: 13.3889 },
		},
		{
			startCoord: { lat: 52.5244, lon: 13.4105 }, // Around Unter den Linden
			endCoord: { lat: 52.5186, lon: 13.3761 },
		},
		{
			startCoord: { lat: 52.5067, lon: 13.3264 }, // Charlottenburg area
			endCoord: { lat: 52.5087, lon: 13.3386 },
		},
	];

	// Simulate Express response object for testing
	const mockResponse = {
		status: (code: number) => ({
			json: (data: any) => {
				console.log(`Status ${code}:`, data);
				return mockResponse;
			},
		}),
		json: (data: any) => {
			console.log(
				"Batch results:",
				data.map((result: any, index: number) => ({
					route: index + 1,
					overlaps: result.overlaps,
					overlapRatio: `${(result.overlapRatio * 100).toFixed(1)}%`,
					distance_m: result.distance_m,
					note: result.note,
				})),
			);
			return mockResponse;
		},
	} as any;

	try {
		await handleBikeLaneBatch(routes, mockResponse);
	} catch (error) {
		console.error("Error in batch processing:", error);
	}
}

// Example 3: API endpoint simulation
async function exampleAPIEndpoint() {
	// Simulate Express request object
	const mockRequest = {
		query: {
			startLat: "52.5200",
			startLon: "13.4050",
			endLat: "52.5170",
			endLon: "13.3889",
		},
	} as any;

	const mockResponse = {
		status: (code: number) => ({
			json: (data: any) => {
				console.log(`API Status ${code}:`, data);
				return mockResponse;
			},
		}),
		json: (data: any) => {
			console.log("API result:", {
				overlaps: data.overlaps,
				overlapRatio: `${(data.overlapRatio * 100).toFixed(1)}%`,
				distance_m: data.distance_m,
				note: data.note,
			});
			return mockResponse;
		},
	} as any;

	try {
		await handleBikeLaneRequest(mockRequest, mockResponse);
	} catch (error) {
		console.error("Error in API endpoint:", error);
	}
}

// Run examples
async function runExamples() {
	console.log("=== Bike Lane Overlap Checking Examples ===\n");

	console.log("1. Single Route Check:");
	await exampleSingleRoute();

	console.log("\n2. Batch Routes Check:");
	await exampleBatchRoutes();

	console.log("\n3. API Endpoint Simulation:");
	await exampleAPIEndpoint();
}

// Export for use in other files
export {
	exampleSingleRoute,
	exampleBatchRoutes,
	exampleAPIEndpoint,
	runExamples,
};

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	runExamples().catch(console.error);
}
