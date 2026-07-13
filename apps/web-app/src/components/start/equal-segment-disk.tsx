import React, { useMemo } from "react";
import { trafficColors, uiColors } from "../match/utils";

type EqualSegmentsDiscProps = {
	size?: number;
	segmentColors?: { occupied: string; empty: string }[];
	occupiedBlocks?: number[];
	showLabels?: boolean;
	isLoading?: boolean;
};

export const EqualSegmentsDisc: React.FC<EqualSegmentsDiscProps> = ({
	size = 300,
	segmentColors = [
		{ occupied: trafficColors.yellow, empty: uiColors.grayLight },
	],
	occupiedBlocks = [],
	showLabels = true,
	isLoading = false,
}) => {
	const centerX = size / 2;
	const centerY = size / 2;
	const outerRadius = size / 2;
	const sliceRadius = outerRadius - 10;
	// Old design used: cx=350, cy=350, r=204 on a 700x700 viewBox.
	// Keep the same proportion so the look stays consistent when `size` changes.
	const innerCutoutRadius = (204 / 700) * size;

	const FULL_CIRCLE_RADIANS = Math.PI * 2;
	const segmentsCount = 10;
	const clampedSegmentsCount = Math.max(1, segmentsCount | 0);
	const startAtTwelveOClock = -Math.PI / 2;

	const palette = segmentColors[0] ?? {
		occupied: trafficColors.yellow,
		empty: uiColors.grayLight,
	};

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
			const startAngle = startAtTwelveOClock + zeroBasedIndex * sliceAngle;
			const endAngle = startAtTwelveOClock + (zeroBasedIndex + 1) * sliceAngle;

			const startX = centerX + sliceRadius * Math.cos(startAngle);
			const startY = centerY + sliceRadius * Math.sin(startAngle);
			const endX = centerX + sliceRadius * Math.cos(endAngle);
			const endY = centerY + sliceRadius * Math.sin(endAngle);

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

			const midAngle =
				startAtTwelveOClock + (zeroBasedIndex + 0.5) * sliceAngle;
			const labelX = centerX + sliceRadius * 0.75 * Math.cos(midAngle);
			const labelY = centerY + sliceRadius * 0.75 * Math.sin(midAngle);

			const colorIndex = ((oneBasedIndex - 1) % 4) + 1;
			const loadingClasses = isLoading
				? `loading-seg loading-seg-${oneBasedIndex} loading-seg-color-${colorIndex}`
				: "";

			return {
				key: oneBasedIndex,
				pathData,
				fillColor,
				labelX,
				labelY,
				loadingClasses,
			};
		});
	}, [
		clampedSegmentsCount,
		centerX,
		centerY,
		sliceRadius,
		occupiedIndexSet,
		palette,
		isLoading,
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
								className={slice.loadingClasses}
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
					<circle cx={centerX} cy={centerY} r={innerCutoutRadius} fill="#fff" />
				</svg>
			</div>
		</div>
	);
};
