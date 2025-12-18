import { useId } from "react";
import type { FC } from "react";

type CircleChartSegment = {
	/**
	 * Name for the data segment
	 */
	name: string;
	count: number;
	/**
	 * Percentage value for the data segment
	 */
	percentage: number;
	/**
	 * Color for the data segment
	 */
	color: string;
	/**
	 * Optional offset for the label position (e.g., "15%", "50%")
	 */
	labelOffset?: string;
};

type ComputedSegment = CircleChartSegment & {
	radius: number;
	strokeWidth: number;
	labelRadius: number;
	key: string;
};

export type CircleChartProps = {
	/**
	 * Data points to render as concentric circles.
	 */
	data: CircleChartSegment[];
	/**
	 * Overall size of the square SVG in pixels.
	 */
	size?: number;
	/**
	 * Font size for the labels.
	 */
	fontSize?: number;
	/**
	 * Minimum inner radius of the first ring to avoid starting at the center.
	 */
	minRadius?: number;
	/**
	 * Optional descriptive paragraph rendered next to the chart.
	 */
	description?: string;
};

/**
 * CircleChart component renders a concentric circle chart using SVG.
 */
export const CircleChart: FC<CircleChartProps> = ({
	data,
	size = 240,
	fontSize = 12,
	minRadius = 0.3,
	description,
}) => {
	const chartInstanceId = useId();
	const center = size / 2;
	const maxRadius = center - 4; // leave a little padding to avoid clipping
	const clampedMinRadius = minRadius * maxRadius;
	const gap = fontSize * 1.5;


	// build computed segment data; pass a single options object to satisfy
	// the linter rule (max-params)
	const segments = buildSegments({ data, minRadius: clampedMinRadius, maxRadius, gap });

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
							<text key={`label-${segment.key}`} fontSize={fontSize}>
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
					Verkehrsmix
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
							<span>{`${segment.percentage}%`}</span>
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

type BuildSegmentsOptions = {
	data: CircleChartSegment[];
	minRadius: number;
	maxRadius: number;
	gap: number;
};

const buildSegments = ({ data, minRadius, maxRadius, gap }: BuildSegmentsOptions): ComputedSegment[] => {
	const totalValue = data.reduce((sum, segment) => sum + segment.percentage, 0);
	const totalGap = gap * data.length;
	const availableSpan = Math.max(maxRadius - minRadius - totalGap, 0);
	const scale = totalValue > 0 ? availableSpan / totalValue : 0;

	let currentInnerRadius = minRadius;

	return data.map((segment, index) => {
		const strokeWidth = segment.percentage * scale;
		const radius = currentInnerRadius + strokeWidth / 2;
		const labelRadius = currentInnerRadius + strokeWidth + gap / 2;

		currentInnerRadius += strokeWidth + gap;

		return {
			...segment,
			radius,
			strokeWidth,
			labelRadius,
			key: `${segment.name}-${index}`,
		};
	});
};

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
			? `, while ${trailingSegment.name} trails at ${trailingSegment.percentage}%`
			: "";
	const totalMessage = totalCount
		? ` across ${totalCount.toLocaleString()} total observations`
		: "";

	return `${topSegment.name} leads this ${categories}-segment profile with ${topSegment.percentage}%${trailingMessage}${totalMessage}, highlighting how usage is distributed today.`;
};

const lightenColor = (hex: string, intensity = 0.5): string => {
	const normalizedHex = hex.replace("#", "");
	const value =
		normalizedHex.length === 3
			? normalizedHex
					.split("")
					.map((char) => char + char)
					.join("")
			: normalizedHex;

	const num = parseInt(value, 16);
	const r = (num >> 16) & 255;
	const g = (num >> 8) & 255;
	const b = num & 255;

	const mix = (channel: number) =>
		Math.round(channel + (255 - channel) * intensity);

	const newR = mix(r);
	const newG = mix(g);
	const newB = mix(b);

	const toHex = (channel: number) => channel.toString(16).padStart(2, "0");

	return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

export default CircleChart;
