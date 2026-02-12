import * as d3 from "d3";
import React, { useCallback } from "react";
import { useBerlinGeojson } from "./hooks/use-berlin-districts-geojson";
import { BerlinPaths } from "./berlin-paths";

type BerlinMapProps = {
	lat: number;
	lon: number;
	width?: number;
	height?: number;
};

export const BerlinMap: React.FC<BerlinMapProps> = ({
	lat,
	lon,
	width = 200,
	height = 200,
}) => {
	const location = { lat, lon };
	const berlinGeoJson = useBerlinGeojson();

	const svgMargin = { top: 0, right: 0, bottom: 0, left: 0 };
	const innerHeight = height - svgMargin.top - svgMargin.bottom;

	const scale = width < height ? width / 0.01 : height / 0.01;

	const projection = useCallback(
		d3
			.geoMercator()
			.center([13.4, 52.5])
			.translate([width / 2, innerHeight / 2])
			.scale(scale),
		[width, height, scale],
	);
	return (
		<svg width={width} height={height} className="shrink-0">
			<BerlinPaths projection={projection} berlinGeoJson={berlinGeoJson} />

			{location && projection
				? (() => {
						const point = projection([location.lon, location.lat]);
						if (!point) {
							return null;
						}
						const [x, y] = point as [number, number];
						return (
							<g>
								<circle
									cx={x}
									cy={y}
									r={4}
									fill={d3.color("#ff5722")?.toString() ?? "#ff5722"} //red
									stroke="#ffffff"
									strokeWidth={0}
									role="img"
									aria-label={`location ${location.lat}, ${location.lon}`}
								/>
							</g>
						);
					})()
				: null}
		</svg>
	);
};
