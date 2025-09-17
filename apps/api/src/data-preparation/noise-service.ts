import express from "express";
import type { Coordinates } from "../common";
import { calculateDistanceMeters } from "../utils";

// Base URL for Berlin's WFS (Web Feature Service) endpoint for environmental noise data (2022)
const WFS_ENDPOINT = "https://gdi.berlin.de/services/wfs/ua_stratlaerm_2022";
const NOISE_LAYER_NAME = "ua_stratlaerm_2022:aa_fp_gesamt2022"; // façade LDEN points layer

// Attribute field for LDEN noise level in dB(A)
const NOISE_LEVEL_FIELD = "ges_den";

/**
 * Query LDEN façade point for coordinates array (uses first coordinate).
 *
 * @param coordinates Array of coordinates (uses first coordinate for query)
 *
 * @returns The LDEN value with metadata:
 *   - lden: noise level (rounded to 0.1 dB(A))
 *   - unit: always "dB(A)"
 *   - distance_m: distance from query point to matched feature
 *   - feature_id: ID of the WFS feature
 *   - note: optional message if nothing found
 */
export async function fetchNearestNoiseLevelForCoordinates(
	coordinates: Coordinates[],
) {
	if (coordinates.length === 0) {
		return {
			lden: null,
			unit: "dB(A)",
			distance_m: null,
			feature_id: null,
			note: "No coordinates provided",
		};
	}

	const { lat, lon } = coordinates[0];
	return fetchNearestNoiseLevel(lat, lon);
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
