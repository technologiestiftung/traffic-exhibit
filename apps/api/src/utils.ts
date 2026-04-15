import type {
	Coordinates,
	LineString,
	ModalSplitData,
	ModalSplitPercentages,
} from "./common";

const COORDINATE_PRECISION = 0.0002;
const MAX_FEATURES_PER_QUERY = 5;

/**
 * Create a bounding box filter for WFS queries
 */
export function createBoundingBoxWFS(coordinates: Coordinates[]): string {
	const lons = coordinates.map((c) => c[0]); // longitude is first element
	const lats = coordinates.map((c) => c[1]); // latitude is second element
	const minLon = Math.min(...lons) - COORDINATE_PRECISION;
	const maxLon = Math.max(...lons) + COORDINATE_PRECISION;
	const minLat = Math.min(...lats) - COORDINATE_PRECISION;
	const maxLat = Math.max(...lats) + COORDINATE_PRECISION;

	return `BBOX(geom,${minLon},${minLat},${maxLon},${maxLat},'EPSG:4326')`;
}

/**
 * Build WFS query URL with standard parameters
 */
export function buildWfsUrl(
	endpoint: string,
	layerName: string,
	bboxFilter: string,
): URL {
	const url = new URL(endpoint);
	url.searchParams.set("service", "WFS");
	url.searchParams.set("version", "2.0.0");
	url.searchParams.set("request", "GetFeature");
	url.searchParams.set("typeNames", layerName);
	url.searchParams.set("srsName", "EPSG:4326");
	url.searchParams.set("outputFormat", "json");
	url.searchParams.set("cql_filter", bboxFilter);
	url.searchParams.set("maxFeatures", MAX_FEATURES_PER_QUERY.toString());
	return url;
}

/**
 * Create a GeoJSON LineString from coordinates array
 */
export function createLineStringFromCoordinates(
	coordinates: Coordinates[],
): LineString {
	return {
		type: "LineString",
		coordinates: coordinates, // coordinates are already in [lon, lat] format
	};
}

/**
 * Calculate approximate distance in meters between two geographic coordinates.
 * Uses average scale factors for degrees → meters:
 * - mx: meters per degree longitude (depends on latitude, hence cosine)
 * - my: meters per degree latitude (roughly constant)
 */
export function calculateDistanceMeters(
	pointA: Coordinates,
	pointB: Coordinates,
): number {
	const mx = 111320 * Math.cos((pointA[1] * Math.PI) / 180); // meters per degree longitude, pointA[1] is latitude
	const my = 110540; // meters per degree latitude
	return Math.hypot(
		(pointB[0] - pointA[0]) * mx, // longitude difference, pointA[0] and pointB[0] are longitudes
		(pointB[1] - pointA[1]) * my, // latitude difference, pointA[1] and pointB[1] are latitudes
	);
}

/**
 * Create a bounding box string in format "minLon,minLat,maxLon,maxLat" from coordinates array
 * @param paddingDegrees Half-width padding in degrees on each side (defaults to WFS coordinate precision)
 */
export function createBoundingBoxString(
	coordinates: Coordinates[],
	paddingDegrees: number = COORDINATE_PRECISION,
): string {
	const lons = coordinates.map((c) => c[0]); // longitude is first element
	const lats = coordinates.map((c) => c[1]); // latitude is second element
	const minLon = Math.min(...lons) - paddingDegrees;
	const maxLon = Math.max(...lons) + paddingDegrees;
	const minLat = Math.min(...lats) - paddingDegrees;
	const maxLat = Math.max(...lats) + paddingDegrees;

	return `${minLon},${minLat},${maxLon},${maxLat}`;
}

/**
 * Calculate the percentage distribution of modal split data.
 * @param data - modal split data with absolute counts
 * @returns percentage distribution of modal split data
 */

export function calculatePercentages(
	data: ModalSplitData,
): ModalSplitPercentages {
	const total = data.car + data.bike + data.pedestrian + data.heavy;
	return {
		car: (data.car / total) * 100,
		bike: (data.bike / total) * 100,
		pedestrian: (data.pedestrian / total) * 100,
		heavy: (data.heavy / total) * 100,
	};
}
