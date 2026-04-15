import type { Coordinates } from "../common";
import { logger } from "../logger";

/** OSMF Nominatim policy: max one request per second. */
const NOMINATIM_MIN_INTERVAL_MS = 1000;

let nominatimQueue: Promise<unknown> = Promise.resolve();
let lastNominatimRequestStartMs = 0;

function enqueueNominatimRequest<T>(fn: () => Promise<T>): Promise<T> {
	const scheduled = nominatimQueue.then(async () => {
		const sinceLastStart = Date.now() - lastNominatimRequestStartMs;
		const waitMs = Math.max(0, NOMINATIM_MIN_INTERVAL_MS - sinceLastStart);
		if (waitMs > 0) {
			await new Promise((resolve) => setTimeout(resolve, waitMs));
		}
		lastNominatimRequestStartMs = Date.now();
		return fn();
	});
	nominatimQueue = scheduled.then(
		() => undefined,
		() => undefined,
	);
	return scheduled;
}

interface AddressData {
	address: string | null;
	district: string | null;
}

interface NominatimResponse {
	address?: {
		city_district?: string;
		borough?: string;
		municipality?: string;
		road?: string;
		house_number?: string;
		postcode?: string;
		city?: string;
		town?: string;
		village?: string;
		state?: string;
		country?: string;
	};
	display_name?: string;
}

/**
 * Get address and district information from coordinates using reverse geocoding
 * @param coordinates Array of coordinates, uses the first coordinate for geocoding
 * @returns Promise containing address and district information
 */
export async function getAddress(
	coordinates: Coordinates[],
): Promise<AddressData> {
	if (!coordinates || coordinates.length === 0) {
		return { address: null, district: null };
	}

	const [lon, lat] = coordinates[1];

	try {
		return await enqueueNominatimRequest(() => fetchReverseGeocode(lat, lon));
	} catch (error) {
		logger.error("Error fetching address data:", error);
		return { address: null, district: null };
	}
}

async function fetchReverseGeocode(
	lat: number,
	lon: number,
): Promise<AddressData> {
	const response = await fetch(
		`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
		{
			headers: {
				"User-Agent":
					"traffic-exhibit-api/1.0 (Telraam exhibit; reverse geocoding)",
			},
		},
	);

	if (!response.ok) {
		logger.warn(
			`Nominatim API error: ${response.status} ${response.statusText}`,
		);
		return { address: null, district: null };
	}

	const data: NominatimResponse = await response.json();

	if (!data.address) {
		return { address: null, district: null };
	}

	const address = data.address;

	// Extract district information
	const district =
		address.city_district || address.borough || address.municipality || null;

	// Create a formatted address string
	const addressParts = [];
	if (address.road) {
		addressParts.push(address.road);
	}
	if (address.house_number) {
		addressParts.push(address.house_number);
	}
	if (address.postcode) {
		addressParts.push(address.postcode);
	}
	if (address.city || address.town || address.village) {
		addressParts.push(address.city || address.town || address.village);
	}

	const formattedAddress =
		addressParts.length > 0
			? addressParts.join(", ")
			: data.display_name || null;

	return {
		address: formattedAddress,
		district,
	};
}
