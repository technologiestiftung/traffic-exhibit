import { writeFile } from "fs/promises";
import { calculatePercentages } from "../utils";

/**
 * Enriches Telraam features with modal split percentages
 */
function enrichTelraamDataWithPercentages(features: any[]): any[] {
	return features.map((feature) => {
		if (
			feature.properties &&
			typeof feature.properties.car === "number" &&
			typeof feature.properties.bike === "number" &&
			typeof feature.properties.pedestrian === "number" &&
			typeof feature.properties.heavy === "number"
		) {
			const modalSplitData = {
				car: feature.properties.car,
				bike: feature.properties.bike,
				pedestrian: feature.properties.pedestrian,
				heavy: feature.properties.heavy,
			};

			const percentages = calculatePercentages(modalSplitData);

			// Add percentage data to properties
			return {
				...feature,
				properties: {
					...feature.properties,
					car_percentage: percentages.car,
					bike_percentage: percentages.bike,
					pedestrian_percentage: percentages.pedestrian,
					heavy_percentage: percentages.heavy,
				},
			};
		}
		return feature;
	});
}

const telraamApiKey = process.env.TELRAM_API_KEY;
const telraamApiEndpoint =
	process.env.TELRAM_API_ENDPOINT ||
	"https://telraam-api.net/v1/reports/traffic_snapshot";

interface TelraamResponse {
	// Define the response structure based on your needs
	[key: string]: any;
}

export async function fetchTelraamData(): Promise<TelraamResponse> {
	if (!telraamApiKey) {
		throw new Error("TELRAM_API_KEY environment variable is not set");
	}

	const requestBody = {
		time: "live",
		contents: "minimal",
		area: "13.221419485185322,52.62699882307024,13.652325399454185,52.38167284083056", // Berlin
		// area: "13.3501,52.4806,13.4001,52.5206", // Small area in Berlin
	};

	const headers = new Headers();
	headers.append("X-Api-Key", telraamApiKey);
	headers.append("Content-Type", "application/json");

	const requestOptions = {
		method: "POST",
		headers: headers,
		body: JSON.stringify(requestBody),
		redirect: "follow" as RequestRedirect,
	};

	try {
		const response = await fetch(telraamApiEndpoint, requestOptions);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const result = await response.json();

		// enrich the data with the percentage of each mode using calculatePercentages from utils.ts
		if (result.features && Array.isArray(result.features)) {
			result.features = enrichTelraamDataWithPercentages(result.features);
		}

		//save result in json file
		const path = "./data/telraam-data.json";
		await writeFile(path, JSON.stringify(result, null, 2));

		return result;
	} catch (error) {
		console.error("Error fetching Telraam data:", error);
		throw error;
	}
}
