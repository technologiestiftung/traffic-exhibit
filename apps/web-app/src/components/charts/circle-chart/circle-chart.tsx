import { useId } from "react";
import type { FC } from "react";
import type { CircleChartSegment } from "./circle-chart-utils";
import { buildSegments } from "./circle-chart-utils";

export type CircleChartProps = {
	data: CircleChartSegment[];
	size?: number;
	fontSize?: number;
	minRadius?: number;
};

export const CircleChart: FC<CircleChartProps> = ({
	data,
	size = 300,
	fontSize = 12,
	minRadius = 0.3,
}) => {
	const chartInstanceId = useId();
	const center = size / 2;
	const maxRadius = center - 4; // leave a little padding to avoid clipping
	const clampedMinRadius = minRadius * maxRadius;
	const gap = fontSize * 1.5;

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
							stroke={segment.color}
							strokeWidth={segment.strokeWidth}
							fill="none"
							strokeLinecap="round"
							style={{
								transition: "stroke-width 320ms ease, r 320ms ease",
							}}
						/>
					))}

					{segments.map((segment, index) => {
						const baseOffset = segment.labelOffset ?? "25%";
						console.log(segment.labelOffset);

						return (
							<text key={`label-${segment.key}`} fontSize={fontSize}>
								<textPath
									href={`#${chartInstanceId}-label-${index}`}
									startOffset={baseOffset}
									textAnchor="middle"
									fill={segment.color}
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
