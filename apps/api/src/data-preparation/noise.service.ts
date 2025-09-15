import express from "express";

// Base URL for Berlin's WFS (Web Feature Service) endpoint for environmental noise data (2022)
const WFS_ENDPOINT = "https://gdi.berlin.de/services/wfs/ua_stratlaerm_2022";
const NOISE_LAYER_NAME = "ua_stratlaerm_2022:aa_fp_gesamt2022"; // façade LDEN points layer

// Attribute field for LDEN noise level in dB(A)
const NOISE_LEVEL_FIELD = "ges_den";

type Coordinates = {
	lon: number;
	lat: number;
};

/**
 * Calculate approximate distance in meters between two geographic coordinates.
 * Uses average scale factors for degrees → meters:
 * - mx: meters per degree longitude (depends on latitude, hence cosine)
 * - my: meters per degree latitude (roughly constant)
 */
function calculateDistanceMeters(
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
 * Query LDEN façade point at the specific coordinate using WFS GetFeature.
 *
 * @param lat   Latitude of query point (WGS84).
 * @param lon   Longitude of query point (WGS84).
 *
 * @returns The LDEN value with metadata:
 *   - lden: noise level (rounded to 0.1 dB(A))
 *   - unit: always "dB(A)"
 *   - distance_m: distance from query point to matched feature
 *   - feature_id: ID of the WFS feature
 *   - note: optional message if nothing found
 */
export async function fetchNearestNoiseLevel(lat: number, lon: number) {
	const targetPoint: Coordinates = { lat, lon };

	// Query using WFS GetFeature with spatial filter
	const url = new URL(WFS_ENDPOINT);
	url.searchParams.set("service", "WFS");
	url.searchParams.set("version", "2.0.0");
	url.searchParams.set("request", "GetFeature");
	url.searchParams.set("typeNames", NOISE_LAYER_NAME);
	url.searchParams.set("srsName", "EPSG:4326");
	url.searchParams.set("outputFormat", "application/json");
	url.searchParams.set("count", "50");

	// Use spatial filter to find features within a small buffer around the point
	const bufferMeters = 50;
	url.searchParams.set(
		"cql_filter",
		`DWithin(geom,SRID=4326;POINT(${lon} ${lat}),${bufferMeters},meters)`,
	);

	const response = await fetch(url.toString());
	if (!response.ok) {
		return {
			lden: null,
			unit: "dB(A)",
			distance_m: null,
			feature_id: null,
			note: "Request failed",
		};
	}

	const data = await response.json();
	const features = data.features ?? [];
	if (!features.length) {
		return {
			lden: null,
			unit: "dB(A)",
			distance_m: null,
			feature_id: null,
			note: "No façade point at this coordinate.",
		};
	}

	// Find the closest feature among returned results
	let closestFeature = features[0];
	let closestDistance = Infinity;

	for (const feature of features) {
		const [featureLon, featureLat] = feature.geometry.coordinates as [
			number,
			number,
		];
		const distance = calculateDistanceMeters(targetPoint, {
			lon: featureLon,
			lat: featureLat,
		});
		if (distance < closestDistance) {
			closestDistance = distance;
			closestFeature = feature;
		}
	}

	// Extract LDEN noise value and round to 0.1 dB(A)
	const noiseValue = closestFeature.properties?.[NOISE_LEVEL_FIELD];

	return {
		lden: typeof noiseValue === "number" ? Math.round(noiseValue) : noiseValue,
		unit: "dB(A)",
		distance_m: Math.round(closestDistance),
		feature_id: closestFeature.id as string | undefined,
	};
}

/**
 * Handle a batch request for LDEN values.
 *
 * @param points Array of coordinate objects with lat/lon properties
 * @param res Express response object for sending HTTP response
 * @returns JSON array with noise data for each point, or error response
 */
export async function handleNoiseBatch(
	points: { lat: number; lon: number }[],
	res: express.Response,
) {
	if (!Array.isArray(points) || !points.length) {
		return res.status(400).json({ error: "Send { points: [{lat,lon}, ...] }" });
	}

	try {
		const results = await Promise.all(
			points.map((p) => fetchNearestNoiseLevel(p.lat, p.lon)),
		);
		return res.json(results);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Upstream error";
		return res.status(502).json({ error: message });
	}
}

/**
 * Handle a single LDEN request coming from `GET /api/noise`.
 *
 * @param req Express request object containing lat/lon query parameters
 * @param res Express response object for sending HTTP response
 * @returns JSON object with noise data for the coordinate, or error response
 */
export async function handleNoiseRequest(
	req: express.Request,
	res: express.Response,
) {
	const lat = Number(req.query.lat);
	const lon = Number(req.query.lon);

	if (!isFinite(lat) || !isFinite(lon)) {
		return res.status(400).json({ error: "Provide ?lat=&lon=" });
	}

	try {
		const result = await fetchNearestNoiseLevel(lat, lon);
		return res.json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Upstream error";
		return res.status(502).json({ error: message });
	}
}
