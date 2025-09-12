import express from "express";

// Base URL for Berlin's WFS (Web Feature Service) endpoint for environmental noise data (2017)
const WFS_ENDPOINT = "https://gdi.berlin.de/services/wfs/ua_stratlaerm_2017";
const NOISE_LAYER_TYPE = "ua_stratlaerm_2017:ba_fp_gesamt2017_lden"; //façade LDEN points

// Attribute field for LDEN noise level in dB(A)
const NOISE_LEVEL_FIELD = "ld_ges";

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
 * Query the nearest LDEN façade point around a given coordinate.
 *
 * @param lat   Latitude of query point (WGS84).
 * @param lon   Longitude of query point (WGS84).
 * @param searchRadii Search radii in meters (defaults: 60, 100, 150).
 *
 * @returns The nearest LDEN value with metadata:
 *   - lden: noise level (rounded to 0.1 dB(A))
 *   - unit: always "dB(A)"
 *   - distance_m: distance from query point to matched feature
 *   - feature_id: ID of the WFS feature
 *   - note: optional message if nothing found
 */
export async function fetchNearestNoiseLevel(
	lat: number,
	lon: number,
	searchRadii = [60, 100, 150],
) {
	const targetPoint: Coordinates = { lat, lon };

	// Try progressively larger radii until a façade point is found
	for (const radius of searchRadii) {
		// Construct WFS query URL with parameters
		const url = new URL(WFS_ENDPOINT);
		url.searchParams.set("service", "WFS");
		url.searchParams.set("version", "2.0.0");
		url.searchParams.set("request", "GetFeature");
		url.searchParams.set("typeNames", NOISE_LAYER_TYPE);
		url.searchParams.set("srsName", "EPSG:4326"); // WGS84 coordinates
		url.searchParams.set("outputFormat", "application/json");
		url.searchParams.set(
			"cql_filter",
			// Spatial filter: find features within `radius` meters of the query point
			`DWithin(geom,SRID=4326;POINT(${lon} ${lat}),${radius},meters)`,
		);
		url.searchParams.set("count", "200"); // Max features returned

		// Fetch the features
		const response = await fetch(url.toString());
		if (!response.ok) {
			continue; // Skip this radius if request fails
		}

		const data = await response.json();
		const features = data.features ?? [];
		if (!features.length) {
			continue; // No features in this radius, try the next one
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
			lden:
				typeof noiseValue === "number"
					? Math.round(noiseValue * 10) / 10
					: noiseValue,
			unit: "dB(A)",
			distance_m: Math.round(closestDistance),
			feature_id: closestFeature.id as string | undefined,
		};
	}

	// If no feature found within maximum radius, return fallback result
	return {
		lden: null,
		unit: "dB(A)",
		distance_m: null,
		feature_id: null,
		note: "No façade point within 150 m.",
	};
}

/**
 * Handle a batch request for LDEN values.
 *
 * Validates the incoming `points` array and returns a 400 response when the
 * payload is missing or empty. Otherwise it queries `fetchNearestNoiseLevel`
 * for each point in parallel and returns the array of results.
 *
 * Error handling:
 * - If any upstream call throws an Error instance, the message is returned
 *   with a 502 status.
 * - Non-Error throws are treated as a generic upstream failure and return
 *   a 502 with a short message.
 *
 * @param points Array of objects with { lat, lon } to query
 * @param res Express response object used to send the HTTP response
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
	} catch (e: unknown) {
		if (e instanceof Error) {
			return res.status(502).json({ error: e.message });
		}
		return res.status(502).json({ error: "Upstream error" });
	}
}

/**
 * Handle a single LDEN request coming from `GET /api/noise`.
 *
 * Expected query parameters: `?lat=<number>&lon=<number>`.
 * - Returns 400 when lat or lon are missing or not finite.
 * - On success, returns the object produced by `fetchNearestNoiseLevel`.
 * - On upstream errors, returns 502 and the upstream error message when
 *   available.
 *
 * @param req Express request object (reads req.query.lat and req.query.lon)
 * @param res Express response object used to send the HTTP response
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
		const out = await fetchNearestNoiseLevel(lat, lon);
		return res.json(out);
	} catch (e: unknown) {
		if (e instanceof Error) {
			return res.status(502).json({ error: e.message });
		}
		return res.status(502).json({ error: "Upstream error" });
	}
}
