import React, { useMemo } from "react";
import * as d3 from "d3";
import type { FeatureCollection } from "geojson";

interface BerlinPaths {
	berlinGeoJson: FeatureCollection | null;
	projection: d3.GeoProjection;
}

export const BerlinPaths: React.FC<BerlinPaths> = ({
	berlinGeoJson,
	projection,
}) => {
	const berlinDistrictsPaths = useMemo(() => {
		if (!berlinGeoJson) {
			return [];
		}

		const geoGenerator = d3.geoPath().projection(projection);

		return berlinGeoJson.features.map((feature: d3.GeoPermissibleObjects) =>
			geoGenerator(feature),
		);
	}, [berlinGeoJson, projection]);
	return (
		<>
			{berlinDistrictsPaths.map((path, i) => (
				<path
					key={i}
					d={path ?? ""}
					fill="#000000"
					stroke="#ffffff"
					strokeWidth={1}
					role="presentation"
				/>
			))}
		</>
	);
};
