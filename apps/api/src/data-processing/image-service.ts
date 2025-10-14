import type { Coordinates } from "../common";
import { createBoundingBoxString } from "../utils";

const ACCESS_TOKEN = process.env.MAPILLARY_ACCESS_TOKEN;

interface MapillaryImage {
	id: string;
	is_pano: boolean;
	thumb_256_url?: string;
	thumb_1024_url?: string;
	captured_at: number;
}

interface MapillaryResponse {
	data: MapillaryImage[];
}

/**
 * Searches for the newest non-panoramic image within a bounding box created from coordinates
 * @param coordinates Array of coordinates to create bounding box from
 * @param limit Maximum number of images to fetch (max 2000)
 * @returns Promise<string | null> URL of the newest image or null if none found
 */
export async function getImage(
	coordinates: Coordinates[],
	limit: number = 10,
): Promise<string | null> {
	if (coordinates.length === 0) {
		return null;
	}

	const bbox = createBoundingBoxString(coordinates);
	return getImageInBoundingBox(bbox, limit);
}

/**
 * Searches for the newest non-panoramic image within a bounding box
 * @param bbox Bounding box in format "left,bottom,right,top" (minLon,minLat,maxLon,maxLat)
 * @param limit Maximum number of images to fetch (max 2000)
 * @returns Promise<string | null> URL of the newest image or null if none found
 */
export async function getImageInBoundingBox(
	bbox: string,
	limit: number = 10,
): Promise<string | null> {
	try {
		// Request images with required fields
		const url = `https://graph.mapillary.com/images?access_token=${ACCESS_TOKEN}&fields=id,is_pano,altitude,thumb_256_url,thumb_1024_url,captured_at&&bbox=${bbox}&limit=${limit}`;

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: MapillaryResponse = await response.json();

		if (!data.data || data.data.length === 0) {
			return null;
		}

		// sort images by captured_at descending (newest first)
		data.data.sort((a, b) => b.captured_at - a.captured_at);

		// Filter for non-panoramic images
		const nonPanoImages = data.data.filter((image) => image.is_pano === false);

		if (nonPanoImages.length === 0) {
			return null;
		}

		// Return the highest quality thumbnail available
		const imageUrl =
			nonPanoImages[0].thumb_1024_url || nonPanoImages[0].thumb_256_url;

		if (!imageUrl) {
			return null;
		}

		return imageUrl;
	} catch (_error) {
		return null;
	}
}
