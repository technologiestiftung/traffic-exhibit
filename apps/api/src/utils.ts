import type { Coordinates, LineString } from "./common";

const COORDINATE_PRECISION = 0.00001;
const MAX_FEATURES_PER_QUERY = 5;

/**
 * Create a bounding box filter for WFS queries
 */
export function createBoundingBox(coordinates: Coordinates[]): string {
	const lons = coordinates.map((c) => c.lon);
	const lats = coordinates.map((c) => c.lat);
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
		coordinates: coordinates.map((coord) => [coord.lon, coord.lat]),
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
	const mx = 111320 * Math.cos((pointA.lat * Math.PI) / 180); // meters per degree longitude
	const my = 110540; // meters per degree latitude
	return Math.hypot(
		(pointB.lon - pointA.lon) * mx,
		(pointB.lat - pointA.lat) * my,
	);
}

/**
 * Create a bounding box string in format "minLon,minLat,maxLon,maxLat" from coordinates array
 */
export function createBoundingBoxString(coordinates: Coordinates[]): string {
	const lons = coordinates.map((c) => c.lon);
	const lats = coordinates.map((c) => c.lat);
	const minLon = Math.min(...lons) - COORDINATE_PRECISION;
	const maxLon = Math.max(...lons) + COORDINATE_PRECISION;
	const minLat = Math.min(...lats) - COORDINATE_PRECISION;
	const maxLat = Math.max(...lats) + COORDINATE_PRECISION;

	return `${minLon},${minLat},${maxLon},${maxLat}`;
}
