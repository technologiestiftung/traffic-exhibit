import React, { useMemo } from "react";
import * as d3 from "d3";
import type { FeatureCollection } from "geojson";

interface BerlinDistrictPaths {
	berlinDistrictsGeoJson: FeatureCollection | null;
	projection: d3.GeoProjection;
	pathColor?: string;
}

export const BerlinDistrictPaths: React.FC<BerlinDistrictPaths> = ({
	berlinDistrictsGeoJson,
	projection,
	pathColor = "black",
}) => {
	const berlinDistrictsPaths = useMemo(() => {
		if (!berlinDistrictsGeoJson) {
			return [];
		}

		const geoGenerator = d3.geoPath().projection(projection);

		return berlinDistrictsGeoJson.features.map(
			(feature: d3.GeoPermissibleObjects) => geoGenerator(feature),
		);
	}, [berlinDistrictsGeoJson, projection]);
	return (
		<>
			{berlinDistrictsPaths.map((path, i) => (
				<path
					key={i}
					className="district"
					d={path ?? ""}
					fill="none"
					role="presentation"
					stroke={pathColor}
					strokeWidth={1}
				/>
			))}
		</>
	);
};
