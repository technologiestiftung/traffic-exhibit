import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { logger } from "../logger";

/**
 * Downloads an image from a URL and saves it to the raw-images folder
 */
async function downloadImage(
	imageURL: string,
	segmentId: number,
	rawImagesDir: string,
): Promise<string> {
	// Ensure directory exists
	if (!existsSync(rawImagesDir)) {
		await mkdir(rawImagesDir, { recursive: true });
	}

	const response = await fetch(imageURL);
	if (!response.ok) {
		throw new Error(`Failed to download image: ${response.statusText}`);
	}

	const buffer = await response.arrayBuffer();
	const imageBuffer = Buffer.from(buffer);

	// Determine file extension from URL or content type
	const urlPath = new URL(imageURL).pathname;
	const ext = path.extname(urlPath) || ".jpg";
	const filename = `image-${segmentId}${ext}`;
	const filePath = path.join(rawImagesDir, filename);

	await writeFile(filePath, imageBuffer);
	return filePath;
}

/**
 * Downloads an image, converts it to stereographic projection, and returns the path
 * @param imageURL URL of the image to download
 * @param segmentId Segment ID for naming the files
 * @returns Path to the converted image, or null if processing fails
 */
export async function saveImage(
	imageURL: string,
	segmentId: number,
): Promise<string | null> {
	try {
		const dataDir = path.join(__dirname, "../../data");
		const rawImagesDir = path.join(dataDir, "raw-images");

		// Ensure directories exist
		if (!existsSync(rawImagesDir)) {
			await mkdir(rawImagesDir, { recursive: true });
		}

		// Download image
		logger.debug(`Downloading image for segment ${segmentId}...`);
		const rawImagePath = await downloadImage(imageURL, segmentId, rawImagesDir);

		const filename = path.basename(rawImagePath);
		const relativePath = path.join("data", "raw-images", filename);

		return relativePath;
	} catch (error) {
		logger.error(`Error saving image for segment ${segmentId}:`, error);
		return null;
	}
}
