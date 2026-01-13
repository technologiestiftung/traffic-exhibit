import { useId } from "react";
import type { FC } from "react";
import type { CircleChartSegment } from "./circle-chart-utils";
import { buildSegments, lightenColor } from "./circle-chart-utils";
import { i18n } from "../../i18n/i18n-utils";

export type CircleChartProps = {
	data: CircleChartSegment[];
	size?: number;
	fontSize?: number;
	minRadius?: number;
	description?: string;
};

export const CircleChart: FC<CircleChartProps> = ({
	data,
	size = 300,
	fontSize = 12,
	minRadius = 0.3,
	description,
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

	const summary =
		description ??
		describeSegments(data) ??
		"This visualization highlights the share of each traffic class.";

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

						return (
							<text
								key={`label-${segment.key}`}
								fontSize={fontSize}
								className="font-numbers"
							>
								<textPath
									href={`#${chartInstanceId}-label-${index}`}
									startOffset={baseOffset}
									textAnchor="middle"
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

			<div className="flex max-w-sm flex-col gap-4 self-center rounded-3xl border border-black/10 bg-white/80 p-6 text-slate-800 shadow-lg lg:ml-auto">
				<h3 className="text-lg font-semibold uppercase tracking-[0.3em] text-slate-600">
					{i18n("circleChart.heading")}
				</h3>
				<p className="text-base leading-relaxed">{summary}</p>
				<ul className="space-y-3">
					{data.map((segment, index) => (
						<li
							key={`legend-${segment.name}-${index}`}
							className="flex items-center justify-between rounded-xl border border-black/20 px-4 py-2 text-sm font-semibold shadow"
							style={{
								backgroundColor: lightenColor(segment.color, 0.55),
								color: "#1a1a1a",
							}}
						>
							<span className="flex items-center gap-3">
								<span
									aria-hidden="true"
									className="inline-block h-3 w-6 rounded-sm border border-black/20"
									style={{ backgroundColor: segment.color }}
								/>
								<span>{segment.name}</span>
							</span>
							<span className="font-numbers">{`${segment.percentage}%`}</span>
						</li>
					))}
				</ul>
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

const describeSegments = (segments: CircleChartSegment[]): string | null => {
	if (!segments.length) {
		return null;
	}

	const totalCount = segments.reduce((sum, segment) => sum + segment.count, 0);
	const sorted = [...segments].sort((a, b) => b.percentage - a.percentage);
	const topSegment = sorted[0];
	const trailingSegment = sorted[sorted.length - 1];
	const categories = segments.length;

	const trailingMessage =
		trailingSegment && trailingSegment !== topSegment
			? `, ${i18n("circleChart.summary.trailingMessage.p1")} ${trailingSegment.name} trails at ${trailingSegment.percentage}%`
			: "";
	const totalMessage = totalCount
		? ` across ${totalCount.toLocaleString()} total observations`
		: "";

	return `${topSegment.name} leads this ${categories}-segment profile with ${topSegment.percentage}%${trailingMessage}${totalMessage}, highlighting how usage is distributed today.`;
};

export default CircleChart;
