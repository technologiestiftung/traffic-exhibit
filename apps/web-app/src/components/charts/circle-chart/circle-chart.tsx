import { useId } from "react";
import type { FC } from "react";
import type { CircleChartSegment } from "./circle-chart-utils";
import { buildSegments } from "./circle-chart-utils";
import { trafficColorsLight } from "../../match/utils";

const isLargeScreen = window.innerWidth >= 1920;

export type CircleChartProps = {
	data: CircleChartSegment[];
	minRadius?: number;
};

export const CircleChart: FC<CircleChartProps> = ({
	data,
	minRadius = 0.3,
}) => {
	const fontSize = isLargeScreen ? 14 : 12;
	const size = isLargeScreen ? 765 : 650;
	const chartInstanceId = useId();
	const center = size / 2;
	const maxRadius = center - 4; // leave a little padding to avoid clipping
	const clampedMinRadius = minRadius * maxRadius;
	const gap = fontSize * 1.6;

	const segments = buildSegments({
		data,
		minRadius: clampedMinRadius,
		maxRadius,
		gap,
	});

	if (!data.length) {
		return null;
	}

	return (
		<div className="flex flex-col gap-8 lg:flex-row lg:items-start">
			<div className="flex flex-col items-center gap-6 lg:-ml-10 lg:items-start">
				<svg
					width={size}
					height={size}
					viewBox={`0 0 ${size} ${size}`}
					role="img"
					aria-label="Concentric circle chart"
					style={{
						filter:
							"drop-shadow(0 10px 18px rgba(156, 155, 155, 0.1)) drop-shadow(0 2px 6px rgba(0,0,0,0.10))",
					}}
				>
					<defs>
						{segments.map((segment, index) => (
							<path
								key={`path-${segment.key}`}
								id={`${chartInstanceId}-label-${index}`}
								d={circlePath(center, center, segment.labelRadius)}
								fill="none"
							/>
						))}
					</defs>

					{segments.map((segment) => (
						<circle
							key={`ring-${segment.key}`}
							cx={center}
							cy={center}
							r={segment.radius}
							stroke={trafficColorsLight[segment.color] ?? segment.color}
							strokeWidth={segment.strokeWidth}
							fill="none"
							strokeLinecap="round"
							style={{
								transition: "stroke-width 320ms ease, r 320ms ease",
							}}
						/>
					))}

					{segments.map((segment, index) => {
						if (segment.percentage === 0) {
							return null;
						}

						return (
							<text key={`label-${segment.key}`} fontSize={fontSize}>
								<textPath
									href={`#${chartInstanceId}-label-${index}`}
									startOffset="25%"
									textAnchor="end"
									fill="#000"
									dominantBaseline="middle"
								>
									{`${segment.name} ${segment.percentage}%`}
								</textPath>
								<animateTransform
									key={`spin-${segment.key}`}
									attributeName="transform"
									type="rotate"
									from={`0 ${center} ${center}`}
									to={`360 ${center} ${center}`}
									dur="1s"
									repeatCount="1"
								/>
							</text>
						);
					})}
				</svg>
			</div>
		</div>
	);
};

const circlePath = (cx: number, cy: number, r: number) =>
	[
		`M ${cx} ${cy - r}`,
		`A ${r} ${r} 0 1 1 ${cx} ${cy + r}`,
		`A ${r} ${r} 0 1 1 ${cx} ${cy - r}`,
	].join(" ");

export default CircleChart;
