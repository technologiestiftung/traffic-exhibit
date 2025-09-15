import * as turf from "@turf/turf";

// Base URL for Berlin's WFS (Web Feature Service) endpoint for bike lane network
const BIKE_NETWORK_WFS_ENDPOINT =
	"https://gdi.berlin.de/services/wfs/radverkehrsnetz";
const BIKE_NETWORK_LAYER_NAME = "radverkehrsnetz:radverkehrsnetz"; // Main bike lane network layer

const BIKE_LANES_WFS_ENDPOINT =
	"https://gdi.berlin.de/services/wfs/fahrradstrassen";
const BIKE_LANES_LAYER_NAME = "fahrradstrassen:fahrradstrassen"; // Dedicated bike streets layer

type Coordinates = {
	lon: number;
	lat: number;
};

type OverlapResult = {
	overlaps: boolean;
	overlappingFeatures: Array<{
		name: string;
		overlapPercentage: number;
		laneType?: string; // Type of bike lane (ist_radvorrangnetz)
	}>;
	note?: string;
};

type LineString = {
	type: "LineString";
	coordinates: number[][];
};

type IntersectionFeature = {
	name: string;
	intersectionPercentage: number;
	laneType?: string; // Type of bike lane (ist_radvorrangnetz)
};

type IntersectionResult = {
	intersectingFeatures: IntersectionFeature[];
};

/**
 * Create a GeoJSON LineString from coordinates array
 */
function createLineStringFromCoordinates(
	coordinates: Coordinates[],
): LineString {
	return {
		type: "LineString",
		coordinates: coordinates.map((coord) => [coord.lon, coord.lat]),
	};
}

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
		// Create a buffer around the bike lane to account for proximity (10 meters)
		const bikeLaneBuffer = turf.buffer(bikeLaneFeature, 10, {
			units: "meters",
		});

		if (!bikeLaneBuffer) {
			return 0;
		}

		// Split route into small segments and check which ones overlap with bike lane buffer
		const segmentLength = 10; // meters
		const numSegments = Math.ceil(totalRouteLength / segmentLength);
		let overlapLength = 0;

		for (let i = 0; i < numSegments; i++) {
			const along = i * segmentLength;
			const segmentPoint = turf.along(routeFeature, along, { units: "meters" });

			if (turf.booleanPointInPolygon(segmentPoint, bikeLaneBuffer)) {
				overlapLength += Math.min(segmentLength, totalRouteLength - along);
			}
		}

		return overlapLength;
	} catch (error) {
		// eslint-disable-next-line no-console
		console.log("Error in buffer-based calculation:", error);
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

	// eslint-disable-next-line no-console
	console.log(`Calculating overlaps for ${features.length} features`);
	// eslint-disable-next-line no-console
	console.log("Route length (meters):", totalRouteLength);

	// For each bike lane feature, calculate actual geometric overlap
	for (const [index, feature] of features.entries()) {
		try {
			const properties = feature.properties || {};
			const featureName =
				(properties.ist_radvorrangnetz as string) ||
				(properties.name as string) ||
				`Bike Lane ${index + 1}`;
			const laneType = properties.ist_radvorrangnetz as string;

			// Skip if feature doesn't have valid geometry
			if (!feature.geometry || !feature.geometry.coordinates) {
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

			// eslint-disable-next-line no-console
			console.log(
				`Feature ${index} (${featureName}): ${overlapLength.toFixed(2)}m overlap`,
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
			console.error(`Error processing feature ${index}:`, error);
		}
	}

	return {
		intersectingFeatures,
	};
}

/**
 * Check bike lane overlap with detailed feature information
 * Returns overlap percentage and feature details
 */
export async function checkBikeLaneOverlap(
	coordinates: Coordinates[],
): Promise<OverlapResult> {
	// eslint-disable-next-line no-console
	console.log("🚴 Starting bike lane overlap analysis...");

	try {
		// First, let's use the working BBOX approach to get actual features (not just counts)
		const lons = coordinates.map((c) => c.lon);
		const lats = coordinates.map((c) => c.lat);
		const minLon = Math.min(...lons) - 0.00001;
		const maxLon = Math.max(...lons) + 0.00001;
		const minLat = Math.min(...lats) - 0.00001;
		const maxLat = Math.max(...lats) + 0.00001;

		const bboxFilter = `BBOX(geom,${minLon},${minLat},${maxLon},${maxLat},'EPSG:4326')`;

		// Query bike network features
		const networkUrl = new URL(BIKE_NETWORK_WFS_ENDPOINT);
		networkUrl.searchParams.set("service", "WFS");
		networkUrl.searchParams.set("version", "2.0.0");
		networkUrl.searchParams.set("request", "GetFeature");
		networkUrl.searchParams.set("typeNames", BIKE_NETWORK_LAYER_NAME);
		networkUrl.searchParams.set("srsName", "EPSG:4326");
		networkUrl.searchParams.set("outputFormat", "json");
		networkUrl.searchParams.set("cql_filter", bboxFilter);
		networkUrl.searchParams.set("maxFeatures", "5");

		// Query bike lanes features
		const lanesUrl = new URL(BIKE_LANES_WFS_ENDPOINT);
		lanesUrl.searchParams.set("service", "WFS");
		lanesUrl.searchParams.set("version", "2.0.0");
		lanesUrl.searchParams.set("request", "GetFeature");
		lanesUrl.searchParams.set("typeNames", BIKE_LANES_LAYER_NAME);
		lanesUrl.searchParams.set("srsName", "EPSG:4326");
		lanesUrl.searchParams.set("outputFormat", "json");
		lanesUrl.searchParams.set("cql_filter", bboxFilter);
		lanesUrl.searchParams.set("maxFeatures", "5");

		// Fetch both endpoints in parallel
		const [networkResponse, lanesResponse] = await Promise.all([
			fetch(networkUrl.toString()),
			fetch(lanesUrl.toString()),
		]);

		if (!networkResponse.ok && !lanesResponse.ok) {
			throw new Error(`Both WFS queries failed`);
		}

		// Parse responses
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
						ist_radvorrangnetz: "bike-lane", // Set lane type for bike lanes
					},
				}),
			);
		}

		// Combine all features
		const features = [...networkFeatures, ...lanesFeatures];

		// eslint-disable-next-line no-console
		console.log(`Found ${features.length} features in bounding box`);

		if (features.length === 0) {
			return {
				overlaps: false,
				overlappingFeatures: [],
			};
		}

		// Calculate actual geometric intersection using simplified approach
		const routeLineString = createLineStringFromCoordinates(coordinates);
		const intersectionResults = await calculateIntersectionWithBikeLanes(
			routeLineString,
			features,
		);

		// Process overlapping features with actual intersection data
		const overlappingFeatures = intersectionResults.intersectingFeatures.map(
			(feature) => ({
				name: feature.name,
				overlapPercentage: feature.intersectionPercentage,
				laneType: feature.laneType,
			}),
		);

		return {
			overlaps: overlappingFeatures.length > 0,
			overlappingFeatures: overlappingFeatures,
		};
	} catch (error) {
		return {
			overlaps: false,
			overlappingFeatures: [],
			note:
				error instanceof Error ? error.message : "Advanced WFS query failed",
		};
	}
}
