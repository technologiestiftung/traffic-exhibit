import React, { useMemo } from "react";
import { trafficColors } from "../match/utils";

type EqualSegmentsDiscProps = {
	size?: number;
	segmentColors?: { occupied: string; empty: string }[];
	occupiedBlocks?: number[];
	showLabels?: boolean;
};

export const EqualSegmentsDisc: React.FC<EqualSegmentsDiscProps> = ({
	size = 300,
	segmentColors = [{ occupied: trafficColors.green, empty: "#999999" }],
	occupiedBlocks = [],
	showLabels = true,
}) => {
	// Geometry
	const centerX = size / 2;
	const centerY = size / 2;
	const outerRadius = size / 2;
	const sliceRadius = outerRadius - 10;

	// Angles
	const FULL_CIRCLE_RADIANS = Math.PI * 2;
	const segmentsCount = 10;
	const clampedSegmentsCount = Math.max(1, segmentsCount | 0);
	const startAtTwelveOClock = -Math.PI / 2; // SVG coords: -π/2 is the top

	// Colors
	const palette = segmentColors[0] ?? {
		occupied: trafficColors.green,
		empty: "#999999",
	};

	// 1-based occupied indices -> fast lookup
	const occupiedIndexSet = useMemo(() => {
		const set = new Set<number>();
		for (const index of occupiedBlocks) {
			if (
				Number.isInteger(index) &&
				index >= 1 &&
				index <= clampedSegmentsCount
			) {
				set.add(index);
			}
		}
		return set;
	}, [occupiedBlocks, clampedSegmentsCount]);

	const slices = useMemo(() => {
		const sliceAngle = FULL_CIRCLE_RADIANS / clampedSegmentsCount;

		return Array.from({ length: clampedSegmentsCount }, (_, zeroBasedIndex) => {
			// Clockwise sweep: add angles from the starting offset
			const startAngle = startAtTwelveOClock + zeroBasedIndex * sliceAngle;
			const endAngle = startAtTwelveOClock + (zeroBasedIndex + 1) * sliceAngle;

			const startX = centerX + sliceRadius * Math.cos(startAngle);
			const startY = centerY + sliceRadius * Math.sin(startAngle);
			const endX = centerX + sliceRadius * Math.cos(endAngle);
			const endY = centerY + sliceRadius * Math.sin(endAngle);

			// Arc flags (small arc, clockwise)
			const largeArcFlag = 0;
			const sweepFlag = 1;

			const pathData = [
				`M ${centerX} ${centerY}`,
				`L ${startX} ${startY}`,
				`A ${sliceRadius} ${sliceRadius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`,
				"Z",
			].join(" ");

			const oneBasedIndex = zeroBasedIndex + 1;
			const fillColor = occupiedIndexSet.has(oneBasedIndex)
				? palette.occupied
				: palette.empty;

			// label position (midpoint of the slice)
			const midAngle =
				startAtTwelveOClock + (zeroBasedIndex + 0.5) * sliceAngle;
			const labelX = centerX + sliceRadius * 0.75 * Math.cos(midAngle);
			const labelY = centerY + sliceRadius * 0.75 * Math.sin(midAngle);

			return {
				key: oneBasedIndex,
				pathData,
				fillColor,
				labelX,
				labelY,
			};
		});
	}, [
		clampedSegmentsCount,
		centerX,
		centerY,
		sliceRadius,
		occupiedIndexSet,
		palette,
	]);

	return (
		<div>
			<div className="inline-block" aria-hidden={false}>
				<svg
					width={size}
					height={size}
					viewBox={`0 0 ${size} ${size}`}
					role="img"
					aria-label={`${clampedSegmentsCount} equal segments disc (clockwise from 12)`}
				>
					{slices.map((slice) => (
						<g key={slice.key}>
							<path
								d={slice.pathData}
								fill={slice.fillColor}
								stroke="#fff"
								strokeWidth={2}
								strokeLinejoin="round"
							/>
							{showLabels && (
								<text
									x={slice.labelX}
									y={slice.labelY}
									textAnchor="middle"
									dominantBaseline="central"
									fontSize={size * 0.07}
								>
									{slice.key}
								</text>
							)}
						</g>
					))}

					{/* Inner cutout */}
					<circle cx={centerX} cy={centerY} r={sliceRadius * 0.6} fill="#fff" />
				</svg>
			</div>
		</div>
	);
};
