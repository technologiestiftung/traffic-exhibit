const ACCESS_TOKEN = process.env.MAPILLARY_ACCESS_TOKEN;

interface MapillaryImage {
	id: string;
	captured_at: number;
	is_pano: boolean;
	thumb_256_url?: string;
	thumb_1024_url?: string;
	thumb_2048_url?: string;
	thumb_original_url?: string;
}

interface MapillaryResponse {
	data: MapillaryImage[];
	paging?: {
		cursors: {
			after: string;
		};
		next: string;
	};
}

/**
 * Searches for the newest non-panoramic image within a bounding box
 * @param bbox Bounding box in format "left,bottom,right,top" (minLon,minLat,maxLon,maxLat)
 * @param limit Maximum number of images to fetch (max 2000)
 * @returns Promise<string | null> URL of the newest image or null if none found
 */
export async function getNewestImageInBoundingBox(
	bbox: string,
	limit: number = 10,
): Promise<string | null> {
	try {
		// Request images with required fields
		const url = `https://graph.mapillary.com/images?access_token=${ACCESS_TOKEN}&fields=id,captured_at,is_pano,thumb_256_url,thumb_1024_url,thumb_2048_url,thumb_original_url&bbox=${bbox}&limit=${limit}`;

		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: MapillaryResponse = await response.json();

		if (!data.data || data.data.length === 0) {
			return null;
		}

		// Filter for non-panoramic images and sort by captured_at (newest first)
		const nonPanoImages = data.data
			.filter((image) => image.is_pano === false)
			.sort((a, b) => b.captured_at - a.captured_at);

		if (nonPanoImages.length === 0) {
			return null;
		}

		const newestImage = nonPanoImages[0];

		// Return the highest quality thumbnail available
		const imageUrl =
			newestImage.thumb_original_url ||
			newestImage.thumb_2048_url ||
			newestImage.thumb_1024_url ||
			newestImage.thumb_256_url;

		if (!imageUrl) {
			return null;
		}

		return imageUrl;
	} catch (_error) {
		return null;
	}
}
