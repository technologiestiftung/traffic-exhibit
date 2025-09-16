import fs from "node:fs";
import path from "node:path";
import { FeatureCollection, MultiPolygon } from "geojson";
import * as turf from "@turf/turf";

// Load the GeoJSON file
const geojsonFilePath = path.join(__dirname, "./data/airquality_index.geojson");
const geojsonData = fs.readFileSync(geojsonFilePath, "utf8");
const geojson: FeatureCollection<MultiPolygon, { Worst_Index: number }> =
	JSON.parse(geojsonData);

// Function to find the Worst_Index for a given coordinate
export function findWorstIndexForCoordinate(
	lng: number,
	lat: number,
): number | null {
	const point = turf.point([lng, lat]);

	for (const feature of geojson.features) {
		const turfPolygon = turf.multiPolygon(feature.geometry.coordinates);
		if (turf.booleanPointInPolygon(point, turfPolygon)) {
			return feature.properties.Worst_Index;
		}
	}

	return null; // Return null if the point is not in any polygon
}
