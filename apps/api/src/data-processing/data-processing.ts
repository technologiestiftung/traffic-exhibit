import "dotenv/config";
import { writeFile } from "fs/promises";
import path from "path";
import { fetchTelraamData } from "./telraam-service";
import { getAirQuality } from "./air-quality-service";
import { getImage } from "./image-service";
import { getBikeLaneOverlap } from "./bike-lane-service";
import { getNearestNoiseLevel } from "./noise-service";
import { getAddress } from "./address-service";
import type { Coordinates } from "../common";

interface TelraamFeature {
	type: string;
	geometry: {
		type: string;
		coordinates: number[][][];
	};
	properties: {
		segment_id: number;
		last_data_package: string;
		timezone: string;
		date: string;
		period: string;
		uptime: number;
		heavy: number;
		car: number;
		bike: number;
		pedestrian: number;
		night: string | number;
	};
}

interface EnrichedFeatureData {
	segment_id: number;
	coordinates: Coordinates[];
	airQuality: number | null;
	imageURL: string | null;
	bikeLaneTypes: string[];
	nearestNoiseLevel: number | null;
	address: string | null;
	district: string | null;
	originalProperties: TelraamFeature["properties"];
}

/**
 * Extract coordinates from a MultiLineString geometry
 */
function extractCoordinatesFromFeature(feature: TelraamFeature): Coordinates[] {
	const coords: Coordinates[] = [];

	if (feature.geometry.type === "MultiLineString") {
		// For MultiLineString, take all coordinate pairs from all line strings
		for (const lineString of feature.geometry.coordinates) {
			for (const coordinate of lineString) {
				coords.push([coordinate[0], coordinate[1]] as Coordinates);
			}
		}
	}

	return coords;
}

/**
 * Process a single Telraam feature to enrich it with additional data
 */
async function processFeature(
	feature: TelraamFeature,
): Promise<EnrichedFeatureData> {
	const coordinates = extractCoordinatesFromFeature(feature);

	console.log(
		`Processing segment ${feature.properties.segment_id} with ${coordinates.length} coordinates...`,
	);

	try {
		// Get air quality (only needs first coordinate)
		const airQuality = getAirQuality(coordinates);

		// Get image for the area
		const imageURL = await getImage(coordinates);

		// Get bike lane overlap information
		const bikeLaneOverlap = await getBikeLaneOverlap(coordinates);

		// Get nearest noise level (only needs first coordinate)
		const noiseResult = await getNearestNoiseLevel(coordinates);

		// Get address and district from coordinates (reverse geocoding)
		const addressData = await getAddress(coordinates);

		return {
			segment_id: feature.properties.segment_id,
			coordinates,
			airQuality,
			imageURL,
			bikeLaneTypes: bikeLaneOverlap.overlappingLaneTypes,
			nearestNoiseLevel: noiseResult,
			address: addressData.address,
			district: addressData.district,
			originalProperties: feature.properties,
		};
	} catch (error) {
		console.error(
			`Error processing segment ${feature.properties.segment_id}:`,
			error,
		);

		// Return partial data in case of error
		return {
			segment_id: feature.properties.segment_id,
			coordinates,
			airQuality: null,
			imageURL: null,
			bikeLaneTypes: [],
			nearestNoiseLevel: null,
			address: null,
			district: null,
			originalProperties: feature.properties,
		};
	}
}

/**
 * Main function to fetch Telraam data and enrich it with additional information
 */
export async function processAllTelraamData(): Promise<EnrichedFeatureData[]> {
	console.log("Starting comprehensive Telraam data processing...");

	try {
		// Step 1: Fetch fresh Telraam data
		console.log("Fetching fresh Telraam data...");
		await fetchTelraamData();

		// Step 2: Read the saved data
		console.log("Reading saved Telraam data...");
		const telraamDataPath = path.join(
			__dirname,
			"../../data/telraam-data.json",
		);
		const telraamData = await import(telraamDataPath);

		if (!telraamData.features || !Array.isArray(telraamData.features)) {
			throw new Error("Invalid Telraam data format");
		}

		console.log(`Found ${telraamData.features.length} features to process`);

		// Step 3: Process each feature
		const enrichedResults: EnrichedFeatureData[] = [];

		for (const [index, feature] of telraamData.features.entries()) {
			console.log(
				`Processing feature ${index + 1}/${telraamData.features.length}`,
			);

			const enrichedFeature = await processFeature(feature);
			enrichedResults.push(enrichedFeature);

			// Add a small delay to avoid overwhelming external APIs
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		// Step 4: Save enriched results
		const outputPath = path.join(
			__dirname,
			"../../data/enriched-telraam-data.json",
		);
		await writeFile(outputPath, JSON.stringify(enrichedResults, null, 2));

		console.log(`Processing complete! Enriched data saved to ${outputPath}`);
		console.log(`Processed ${enrichedResults.length} features`);

		// Log summary statistics
		const featuresWithImages = enrichedResults.filter(
			(f) => f.imageURL !== null,
		).length;
		const featuresWithAirQuality = enrichedResults.filter(
			(f) => f.airQuality !== null,
		).length;
		const featuresWithNoise = enrichedResults.filter(
			(f) => f.nearestNoiseLevel !== null,
		).length;
		const featuresWithBikeLanes = enrichedResults.filter(
			(f) => f.bikeLaneTypes.length > 0,
		).length;

		console.log("\nSummary:");
		console.log(
			`- Features with images: ${featuresWithImages}/${enrichedResults.length}`,
		);
		console.log(
			`- Features with air quality data: ${featuresWithAirQuality}/${enrichedResults.length}`,
		);
		console.log(
			`- Features with noise data: ${featuresWithNoise}/${enrichedResults.length}`,
		);
		console.log(
			`- Features with bike lane data: ${featuresWithBikeLanes}/${enrichedResults.length}`,
		);

		return enrichedResults;
	} catch (error) {
		console.error("Error in processAllTelraamData:", error);
		throw error;
	}
}

/**
 * Run the processing script (for direct execution)
 */
if (require.main === module) {
	processAllTelraamData()
		.then(() => {
			console.log("Script completed successfully");
			process.exit(0);
		})
		.catch((error) => {
			console.error("Script failed:", error);
			process.exit(1);
		});
}
