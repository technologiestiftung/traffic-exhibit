import "dotenv/config";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { fetchTelraamData } from "./telraam-service";
import { logger } from "../logger";
import { getAirQuality } from "./air-quality-service";
import { getImage } from "./image-service";
import { getBikeLaneOverlap } from "./bike-lane-service";
import { getNearestNoiseLevel } from "./noise-service";
import { getAddress } from "./address-service";
import type { Coordinates, TrafficFeature } from "../common";

interface EnrichedFeatureData {
	segment_id: number;
	coordinates: Coordinates[];
	airQuality: number | null;
	imageURL: string | null;
	bikeLaneTypes: string[];
	nearestNoiseLevel: number | null;
	address: string | null;
	district: string | null;
	originalProperties: TrafficFeature["properties"];
}

/**
 * Extract coordinates from a MultiLineString geometry
 */
function extractCoordinatesFromFeature(feature: TrafficFeature): Coordinates[] {
	const coords: Coordinates[] = [];

	if (feature.geometry.type === "MultiLineString") {
		// For MultiLineString, take all coordinate pairs from all line strings
		for (const lineString of feature.geometry.coordinates) {
			for (const coordinate of lineString) {
				const coord = coordinate as number[];
				coords.push([coord[0], coord[1]] as Coordinates);
			}
		}
	}

	return coords;
}

/**
 * Process a single Telraam feature to enrich it with additional data
 */
async function processFeature(
	feature: TrafficFeature,
	previous?: EnrichedFeatureData,
): Promise<EnrichedFeatureData> {
	const coordinates = extractCoordinatesFromFeature(feature);

	logger.debug(
		`Processing segment ${feature.properties.segment_id} with ${coordinates.length} coordinates...`,
	);

	try {
		// Air quality: reuse previous value if present, otherwise get new
		const airQuality: number | null =
			previous && previous.airQuality !== null
				? previous.airQuality
				: getAirQuality(coordinates);

		// Image: reuse previous if available, otherwise fetch now
		const imageURL: string | null =
			previous && previous.imageURL !== null
				? previous.imageURL
				: await getImage(coordinates);

		// Bike lane types: reuse if previously present (non-empty)
		let bikeLaneTypes: string[];
		if (previous && previous.bikeLaneTypes && previous.bikeLaneTypes.length) {
			bikeLaneTypes = previous.bikeLaneTypes;
		} else {
			const bikeLaneOverlap = await getBikeLaneOverlap(coordinates);
			bikeLaneTypes = bikeLaneOverlap.overlappingLaneTypes;
		}

		// Noise level: reuse if previous value not null
		const nearestNoiseLevel: number | null =
			previous && previous.nearestNoiseLevel !== null
				? previous.nearestNoiseLevel
				: await getNearestNoiseLevel(coordinates);

		// Address & district: reuse if present
		let address: string | null = previous?.address ?? null;
		let district: string | null = previous?.district ?? null;
		// Fetch fresh address data if either field is missing
		if (address === null || district === null) {
			const addressData = await getAddress(coordinates);
			// Only fill in missing parts
			if (address === null) {
				address = addressData.address;
			}
			if (district === null) {
				district = addressData.district;
			}
		}

		return {
			segment_id: feature.properties.segment_id,
			coordinates,
			airQuality,
			imageURL,
			bikeLaneTypes,
			nearestNoiseLevel,
			address,
			district,
			originalProperties: feature.properties,
		};
	} catch (error) {
		logger.error(
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
	logger.info("Starting comprehensive Telraam data processing...");

	try {
		// Step 1: Fetch fresh Telraam data
		logger.info("Fetching fresh Telraam data...");
		await fetchTelraamData();

		// Step 2: Read the saved data
		logger.info("Reading saved Telraam data...");
		const telraamDataPath = path.join(
			__dirname,
			"../../data/telraam-data.json",
		);
		const telraamData = await import(telraamDataPath);

		if (!telraamData.features || !Array.isArray(telraamData.features)) {
			throw new Error("Invalid Telraam data format");
		}

		logger.info(`Found ${telraamData.features.length} features to process`);

		// Step 2.5: Try load existing enriched data for reuse (if exists)
		const previousEnrichedPath = path.join(
			__dirname,
			"../../data/enriched-telraam-data.json",
		);
		let previousBySegment: Map<number, EnrichedFeatureData> = new Map();
		try {
			const rawPrev = await readFile(previousEnrichedPath, "utf-8");
			const parsedPrev: EnrichedFeatureData[] = JSON.parse(rawPrev);
			previousBySegment = new Map(parsedPrev.map((f) => [f.segment_id, f]));
			logger.info(
				`Loaded ${previousBySegment.size} previously enriched segments for reuse`,
			);
		} catch {
			logger.warn("No previous enriched data found (fresh run).");
		}

		// Step 3: Process each feature
		const enrichedResults: EnrichedFeatureData[] = [];
		let reusedSegments = 0;
		let newSegments = 0;

		for (const [index, feature] of telraamData.features.entries()) {
			logger.debug(
				`Processing feature ${index + 1}/${telraamData.features.length}`,
			);

			const prev = previousBySegment.get(feature.properties.segment_id);
			if (prev) {
				reusedSegments += 1;
			} else {
				newSegments += 1;
			}
			const enrichedFeature = await processFeature(feature, prev);
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
		logger.success(`Processing complete! Enriched data saved to ${outputPath}`);
		logger.info(`Processed ${enrichedResults.length} features`);

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

		logger.info("\nSummary:");
		logger.info(
			`- Reused (skipped) segments: ${reusedSegments} / ${enrichedResults.length}`,
		);
		logger.info(
			`- Newly fetched telraam segments: ${newSegments} / ${enrichedResults.length}`,
		);
		logger.info(
			`- Features with images: ${featuresWithImages}/${enrichedResults.length}`,
		);
		logger.info(
			`- Features with air quality data: ${featuresWithAirQuality}/${enrichedResults.length}`,
		);
		logger.info(
			`- Features with noise data: ${featuresWithNoise}/${enrichedResults.length}`,
		);
		logger.info(
			`- Features with bike lane data: ${featuresWithBikeLanes}/${enrichedResults.length}`,
		);

		return enrichedResults;
	} catch (error) {
		logger.error("Error in processAllTelraamData:", error);
		throw error;
	}
}

/**
 * Run the processing script (for direct execution)
 */
if (require.main === module) {
	processAllTelraamData()
		.then(() => {
			logger.success("Script completed successfully");
			process.exit(0);
		})
		.catch((error) => {
			logger.error("Script failed:", error);
			process.exit(1);
		});
}
