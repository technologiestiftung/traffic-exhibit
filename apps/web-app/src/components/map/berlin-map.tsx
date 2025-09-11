import * as d3 from "d3";
import React, { useCallback } from "react";
import { useBerlinDistrictsGeojson } from "./hooks/use-berlin-districts-geojson";
import { BerlinDistrictPaths } from "./berlin-district-paths";

const CURRENT_LOCATION = {
	lat: 52.52,
	lon: 13.405,
};

export const BerlinMap: React.FC = () => {
	const width = 600;
	const height = 600;
	const berlinDistrictsGeoJson = useBerlinDistrictsGeojson();

	const svgMargin = { top: 0, right: 0, bottom: 5, left: 0 };
	const innerHeight = height - svgMargin.top - svgMargin.bottom;

	const scale = width < height ? width / 0.016 : height / 0.016;

	const projection = useCallback(
		d3
			.geoMercator()
			.center([13.4, 52.5])
			.translate([width / 2, innerHeight / 2])
			.scale(scale),
		[width, height, scale],
	);
	return (
		<svg width={width} height={height}>
			<BerlinDistrictPaths
				projection={projection}
				berlinDistrictsGeoJson={berlinDistrictsGeoJson}
			/>

			{CURRENT_LOCATION && projection
				? (() => {
						const point = projection([
							CURRENT_LOCATION.lon,
							CURRENT_LOCATION.lat,
						]);
						if (!point) {
							return null;
						}
						const [x, y] = point as [number, number];
						return (
							<g>
								<circle
									cx={x}
									cy={y}
									r={7}
									fill={d3.color("#ff5722")?.toString() ?? "#ff5722"}
									stroke="#ffffff"
									strokeWidth={2}
									role="img"
									aria-label={`location ${CURRENT_LOCATION.lat}, ${CURRENT_LOCATION.lon}`}
								/>
							</g>
						);
					})()
				: null}
		</svg>
	);
};
