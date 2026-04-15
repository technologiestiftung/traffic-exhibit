import "dotenv/config";
import { writeFile, readFile } from "fs/promises";
import path from "path";
import { fetchTelraamData } from "./telraam-service";
import { logger } from "../logger";
import { getAirQuality } from "./air-quality-service";
import { getImage } from "./image-service";
import { saveImage } from "./save-image-service";
import { getBikeLaneOverlap } from "./bike-lane-service";
import { getNearestNoiseLevel } from "./noise-service";
import { getAddress } from "./address-service";
import type { Coordinates, TrafficFeature } from "../common";

interface EnrichedFeatureData {
	segment_id: number;
	coordinates: Coordinates[];
	airQuality: number | null;
	imageURL: string | null;
	imageIsPano?: boolean | null;
	bikeLaneTypes: string[];
	nearestNoiseLevel: number | null;
	address: string | null;
	district: string | null;
	originalProperties: TrafficFeature["properties"];
	active: boolean;
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
/** Counts saved images from new Mapillary fetches (not when reusing a saved image). */
interface MapillaryFetchStats {
	panoramic: number;
	nonPanoramic: number;
}

function recordPanoramicMapillaryStats(
	stats: MapillaryFetchStats,
	isPano: boolean,
): void {
	if (isPano) {
		stats.panoramic += 1;
	} else {
		stats.nonPanoramic += 1;
	}
}

function recordMapillaryStatsIfPresent(
	stats: MapillaryFetchStats | undefined,
	isPano: boolean,
): void {
	if (stats) {
		recordPanoramicMapillaryStats(stats, isPano);
	}
}

// eslint-disable-next-line complexity
async function processFeature(
	feature: TrafficFeature,
	previous?: EnrichedFeatureData,
	mapillaryStats?: MapillaryFetchStats,
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

		// Image: reuse previous if available and already processed, otherwise fetch and process
		let imageURL: string | null = null;
		let imageIsPano: boolean | null = null;
		if (
			previous &&
			previous.imageURL &&
			previous.imageURL.startsWith("data/raw-images/")
		) {
			// Reuse previously processed image
			imageURL = previous.imageURL;
			imageIsPano = previous.imageIsPano ?? true;
		} else {
			// Fetch new image URL
			const selection = await getImage(coordinates);
			if (selection) {
				// Process the image: download and save
				imageURL = await saveImage(
					selection.url,
					feature.properties.segment_id,
				);
				if (imageURL) {
					imageIsPano = selection.isPano;
					recordMapillaryStatsIfPresent(mapillaryStats, selection.isPano);
				}
			}
		}

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
		// Fetch fresh address data if either field is missing (Nominatim throttled in getAddress)
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
			imageIsPano,
			bikeLaneTypes,
			nearestNoiseLevel,
			address,
			district,
			originalProperties: feature.properties,
			active: true,
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
			imageIsPano: null,
			bikeLaneTypes: [],
			nearestNoiseLevel: null,
			address: null,
			district: null,
			originalProperties: feature.properties,
			active: true,
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
			previousBySegment = new Map(
				parsedPrev.map((f) => [
					f.segment_id,
					{ ...f, active: f.active !== false },
				]),
			);
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
		let reactivatedSegments = 0;
		const mapillaryFetchStats: MapillaryFetchStats = {
			panoramic: 0,
			nonPanoramic: 0,
		};

		for (const [index, feature] of telraamData.features.entries()) {
			logger.debug(
				`Processing feature ${index + 1}/${telraamData.features.length}`,
			);

			const prev = previousBySegment.get(feature.properties.segment_id);
			if (prev?.active === false) {
				reactivatedSegments += 1;
				logger.info(
					`Reactivated segment ${feature.properties.segment_id} (was inactive, now in Telraam feed)`,
				);
			}
			if (prev) {
				reusedSegments += 1;
			} else {
				newSegments += 1;
			}
			const enrichedFeature = await processFeature(
				feature,
				prev,
				mapillaryFetchStats,
			);
			enrichedResults.push(enrichedFeature);

			// Add a small delay to avoid overwhelming external APIs
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		const processedSegmentIds = new Set(
			(telraamData.features as TrafficFeature[]).map(
				(feat) => feat.properties.segment_id,
			),
		);
		const deactivatedSegmentIds: number[] = [];
		for (const [segmentId, prev] of previousBySegment) {
			if (!processedSegmentIds.has(segmentId)) {
				enrichedResults.push({ ...prev, active: false });
				deactivatedSegmentIds.push(segmentId);
			}
		}
		if (deactivatedSegmentIds.length > 0) {
			logger.info(
				`Preserved ${deactivatedSegmentIds.length} inactive segment(s) not in current Telraam data (segment_id: ${deactivatedSegmentIds.join(", ")})`,
			);
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
		const inactivePreserved = enrichedResults.filter(
			(f) => f.active === false,
		).length;

		logger.info("\nSummary:");
		logger.info(
			`- Reused (skipped) segments: ${reusedSegments} / ${enrichedResults.length}`,
		);
		logger.info(
			`- Newly fetched telraam segments: ${newSegments} / ${enrichedResults.length}`,
		);
		logger.info(`- Reactivated segments: ${reactivatedSegments}`);
		logger.info(`- Inactive preserved (not in feed): ${inactivePreserved}`);
		logger.info(
			`- Features with images: ${featuresWithImages}/${enrichedResults.length}`,
		);
		const mapillaryFetched =
			mapillaryFetchStats.panoramic + mapillaryFetchStats.nonPanoramic;
		if (mapillaryFetched > 0) {
			logger.info(
				`- New Mapillary images saved: ${mapillaryFetched} (panoramic: ${mapillaryFetchStats.panoramic}, non-panoramic: ${mapillaryFetchStats.nonPanoramic})`,
			);
		} else {
			logger.info(
				"- New Mapillary images saved: 0 (all images reused from previous run, fetch failed, or none)",
			);
		}
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
