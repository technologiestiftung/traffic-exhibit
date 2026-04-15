import type { Coordinates } from "../common";
import { createBoundingBoxString } from "../utils";

const ACCESS_TOKEN = process.env.MAPILLARY_ACCESS_TOKEN;

/** Padding in degrees (each side) for Mapillary bbox search; widen if no images match. */
const IMAGE_BBOX_PADDING_SEQUENCE = [0.0002, 0.0004, 0.0006] as const;

interface MapillaryImage {
	id: string;
	is_pano: boolean;
	thumb_256_url?: string;
	thumb_1024_url?: string;
	thumb_original_url?: string;
	captured_at: number;
}

interface MapillaryResponse {
	data: MapillaryImage[];
}

/** Selected Mapillary image URL and whether it is a panorama (360°). */
export interface MapillaryImageSelection {
	url: string;
	isPano: boolean;
}

/**
 * Searches for the newest image within a bounding box created from coordinates
 * @param coordinates Array of coordinates to create bounding box from
 * @param limit Maximum number of images to fetch (max 2000)
 * @returns Selected image or null if none found
 */
export async function getImage(
	coordinates: Coordinates[],
	limit: number = 10,
): Promise<MapillaryImageSelection | null> {
	if (coordinates.length === 0) {
		return null;
	}

	for (const padding of IMAGE_BBOX_PADDING_SEQUENCE) {
		const bbox = createBoundingBoxString(coordinates, padding);
		const selection = await getImageInBoundingBox(bbox, limit);
		if (selection !== null) {
			return selection;
		}
	}

	return null;
}

/**
 * Searches for the newest image within a bounding box
 * @param bbox Bounding box in format "left,bottom,right,top" (minLon,minLat,maxLon,maxLat)
 * @param limit Maximum number of images to fetch (max 2000)
 * @returns Selected image or null if none found
 */
export async function getImageInBoundingBox(
	bbox: string,
	limit: number = 10,
): Promise<MapillaryImageSelection | null> {
	try {
		// Request images with required fields
		const url = `https://graph.mapillary.com/images?access_token=${ACCESS_TOKEN}&fields=id,is_pano,altitude,thumb_256_url,thumb_1024_url,thumb_original_url,captured_at&bbox=${bbox}&limit=${limit}`;

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

		// Filter for panoramic images
		const panoImages = data.data.filter((image) => image.is_pano === true);

		// Use panoramic images if available, otherwise fall back to normal images
		const imagesToUse = panoImages.length > 0 ? panoImages : data.data;

		if (imagesToUse.length === 0) {
			return null;
		}

		const imageUrl =
			imagesToUse[0].thumb_original_url ||
			imagesToUse[0].thumb_1024_url ||
			imagesToUse[0].thumb_256_url;

		if (!imageUrl) {
			return null;
		}

		return { url: imageUrl, isPano: imagesToUse[0].is_pano === true };
	} catch (_error) {
		return null;
	}
}
