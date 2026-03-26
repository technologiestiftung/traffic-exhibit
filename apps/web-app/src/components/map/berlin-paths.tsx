import React, { useMemo } from "react";
import * as d3 from "d3";
import type { FeatureCollection } from "geojson";

interface BerlinPathsProps {
	cityGeoJson: FeatureCollection | null;
	districtsGeoJson: FeatureCollection | null;
	districtStrokeColor: string;
	projection: d3.GeoProjection;
}

export const BerlinPaths: React.FC<BerlinPathsProps> = ({
	cityGeoJson,
	districtsGeoJson,
	districtStrokeColor,
	projection,
}) => {
	const { cityPaths, districtPaths } = useMemo(() => {
		const geoGenerator = d3.geoPath().projection(projection);

		const toPaths = (collection: FeatureCollection | null) => {
			if (!collection) {
				return [];
			}
			return collection.features.map((feature: d3.GeoPermissibleObjects) =>
				geoGenerator(feature),
			);
		};

		return {
			cityPaths: toPaths(cityGeoJson),
			districtPaths: toPaths(districtsGeoJson),
		};
	}, [cityGeoJson, districtsGeoJson, projection]);

	return (
		<>
			{cityPaths.map((path, i) => (
				<path
					key={`city-${i}`}
					d={path ?? ""}
					fill="#000000"
					strokeWidth={1}
					role="presentation"
				/>
			))}
			{districtPaths.map((path, i) => (
				<path
					key={`district-${i}`}
					d={path ?? ""}
					fill="none"
					stroke={districtStrokeColor}
					strokeWidth={2}
					role="presentation"
				/>
			))}
		</>
	);
};
