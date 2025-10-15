import * as turf from "@turf/turf";
import { logger } from "../logger";
import type {
	Coordinates,
	LineString,
	OverlapResult,
	IntersectionFeature,
	IntersectionResult,
} from "../common";
import {
	createBoundingBoxWFS,
	buildWfsUrl,
	createLineStringFromCoordinates,
} from "../utils";

// Constants for WFS endpoints and configuration
const BIKE_NETWORK_WFS_ENDPOINT =
	"https://gdi.berlin.de/services/wfs/radverkehrsnetz";
const BIKE_NETWORK_LAYER_NAME = "radverkehrsnetz:radverkehrsnetz";

const BIKE_LANES_WFS_ENDPOINT =
	"https://gdi.berlin.de/services/wfs/fahrradstrassen";
const BIKE_LANES_LAYER_NAME = "fahrradstrassen:fahrradstrassen";

// Configuration constants
const BUFFER_DISTANCE_METERS = 10;
const SEGMENT_LENGTH_METERS = 10;

/**
 * Calculate overlap between route and a single bike lane feature
 */
function calculateFeatureOverlap(
	routeFeature: ReturnType<typeof turf.lineString>,
	bikeLaneFeature:
		| ReturnType<typeof turf.lineString>
		| ReturnType<typeof turf.multiLineString>,
	totalRouteLength: number,
): number {
	try {
		// Create a buffer around the bike lane to account for proximity
		const bikeLaneBuffer = turf.buffer(
			bikeLaneFeature,
			BUFFER_DISTANCE_METERS,
			{
				units: "meters",
			},
		);

		if (!bikeLaneBuffer) {
			return 0;
		}

		// Split route into small segments and check which ones overlap with bike lane buffer
		const numSegments = Math.ceil(totalRouteLength / SEGMENT_LENGTH_METERS);
		let overlapLength = 0;

		for (let i = 0; i < numSegments; i++) {
			const along = i * SEGMENT_LENGTH_METERS;
			const segmentPoint = turf.along(routeFeature, along, { units: "meters" });

			if (turf.booleanPointInPolygon(segmentPoint, bikeLaneBuffer)) {
				overlapLength += Math.min(
					SEGMENT_LENGTH_METERS,
					totalRouteLength - along,
				);
			}
		}

		return overlapLength;
	} catch (error) {
		logger.error("Error in overlap calculation:", error);
		return 0;
	}
}

/**
 * Calculate actual polyline overlap using turf.js for geometric analysis
 */
async function calculateIntersectionWithBikeLanes(
	routeLineString: LineString,
	features: Array<{
		geometry?: { type: string; coordinates: number[][] | number[][][] };
		properties?: Record<string, unknown>;
	}>,
): Promise<IntersectionResult> {
	const routeFeature = turf.lineString(routeLineString.coordinates);
	const totalRouteLength = turf.length(routeFeature, { units: "meters" });
	const intersectingFeatures: IntersectionFeature[] = [];

	// Process each bike lane feature to calculate geometric overlap
	for (const [index, feature] of features.entries()) {
		try {
			const properties = feature.properties || {};
			const featureName =
				(properties.ist_radvorrangnetz as string) ||
				(properties.name as string) ||
				`Bike Lane ${index + 1}`;
			const laneType = properties.ist_radvorrangnetz as string;

			// Skip if feature doesn't have valid geometry
			if (!feature.geometry?.coordinates) {
				continue;
			}

			let bikeLaneFeature:
				| ReturnType<typeof turf.lineString>
				| ReturnType<typeof turf.multiLineString>;

			// Handle different geometry types
			if (feature.geometry.type === "LineString") {
				bikeLaneFeature = turf.lineString(
					feature.geometry.coordinates as number[][],
				);
			} else if (feature.geometry.type === "MultiLineString") {
				bikeLaneFeature = turf.multiLineString(
					feature.geometry.coordinates as number[][][],
				);
			} else {
				continue;
			}

			// Calculate overlap
			const overlapLength = calculateFeatureOverlap(
				routeFeature,
				bikeLaneFeature,
				totalRouteLength,
			);

			if (overlapLength > 0) {
				const overlapPercentage = (overlapLength / totalRouteLength) * 100;

				intersectingFeatures.push({
					name: String(featureName),
					intersectionPercentage: Math.round(overlapPercentage * 100) / 100,
					laneType: laneType,
				});
			}
		} catch (error) {
			logger.error(`Error processing feature ${index}:`, error);
		}
	}

	return {
		intersectingFeatures,
	};
}

/**
 * Parse WFS responses and combine features from both endpoints
 */
async function parseWfsResponses(
	networkResponse: Response,
	lanesResponse: Response,
): Promise<
	Array<{
		geometry?: { type: string; coordinates: number[][] | number[][][] };
		properties?: Record<string, unknown>;
	}>
> {
	let networkFeatures: Array<{
		geometry?: { type: string; coordinates: number[][] | number[][][] };
		properties?: Record<string, unknown>;
	}> = [];
	let lanesFeatures: Array<{
		geometry?: { type: string; coordinates: number[][] | number[][][] };
		properties?: Record<string, unknown>;
	}> = [];

	if (networkResponse.ok) {
		const networkData = JSON.parse(await networkResponse.text());
		networkFeatures = networkData.features || [];
	}

	if (lanesResponse.ok) {
		const lanesData = JSON.parse(await lanesResponse.text());
		lanesFeatures = (lanesData.features || []).map(
			(feature: {
				geometry?: { type: string; coordinates: number[][] | number[][][] };
				properties?: Record<string, unknown>;
			}) => ({
				...feature,
				properties: {
					...feature.properties,
					ist_radvorrangnetz: "Fahrradstrasse", // Set lane type for bike lanes
				},
			}),
		);
	}

	return [...networkFeatures, ...lanesFeatures];
}

/**
 * Check bike lane overlap with detailed feature information
 * Returns overlap percentage and feature details
 */
export async function getBikeLaneOverlap(
	coordinates: Coordinates[],
): Promise<OverlapResult> {
	try {
		// Create bounding box filter for WFS queries
		const bboxFilter = createBoundingBoxWFS(coordinates);

		// Build URLs for both bike network and bike lanes endpoints
		const networkUrl = buildWfsUrl(
			BIKE_NETWORK_WFS_ENDPOINT,
			BIKE_NETWORK_LAYER_NAME,
			bboxFilter,
		);
		const lanesUrl = buildWfsUrl(
			BIKE_LANES_WFS_ENDPOINT,
			BIKE_LANES_LAYER_NAME,
			bboxFilter,
		);

		// Fetch both endpoints in parallel
		const [networkResponse, lanesResponse] = await Promise.all([
			fetch(networkUrl.toString()),
			fetch(lanesUrl.toString()),
		]);

		if (!networkResponse.ok && !lanesResponse.ok) {
			throw new Error(`Both WFS queries failed`);
		}

		// Parse responses and combine features
		const features = await parseWfsResponses(networkResponse, lanesResponse);

		if (features.length === 0) {
			return {
				overlappingLaneTypes: [],
			};
		}

		// Calculate actual geometric intersection
		const routeLineString = createLineStringFromCoordinates(coordinates);
		const intersectionResults = await calculateIntersectionWithBikeLanes(
			routeLineString,
			features,
		);

		// Process overlapping features
		const overlappingFeatures = intersectionResults.intersectingFeatures.map(
			(feature) => ({
				name: feature.name,
				overlapPercentage: feature.intersectionPercentage,
				laneType: feature.laneType,
			}),
		);

		// create array of overlapping lanetypes with more than 30% overlap
		const overlappingLaneTypes = Array.from(
			new Set(
				overlappingFeatures
					.filter((feature) => feature.overlapPercentage > 30)
					.map((feature) => feature.laneType)
					.filter((type): type is string => !!type),
			),
		);

		return {
			overlappingLaneTypes,
		};
	} catch (error) {
		return {
			overlappingLaneTypes: [],
			note: error instanceof Error ? error.message : "WFS query failed",
		};
	}
}
