import React, { useMemo } from "react";
import type { TelraamMatch } from "../../../../../api/src/common";
import { getTrafficModal } from "../utils";

type TrafficModalSplitProps = {
	telraamMatch: TelraamMatch;
	size?: number;
	isLegendVisible?: boolean;
	areInnerCirclesVisible?: boolean;
	segmentColors?: string[];
	labelColor?: string;
	animationDurationMs?: number;
	animationDelayMs?: number;
	turnsWhileMoving?: number;
	startOffsetPx?: number;
	isAnimationBackwards?: boolean;
};

export const TrafficModalSplit: React.FC<TrafficModalSplitProps> = ({
	telraamMatch,
	size = 300,
	isLegendVisible = true,
	areInnerCirclesVisible = true,
	segmentColors = ["#4CAF50", "#2196F3", "#FFC107", "#FF5722"],
	labelColor = "#fff",
	animationDurationMs = 1200,
	animationDelayMs = 1000, // match CSS default
	turnsWhileMoving = 3,
	startOffsetPx = 0, // left offset for animation
	isAnimationBackwards = false,
}) => {
	const modalData = getTrafficModal(telraamMatch);

	const pieCenter = size / 2;
	const pieOuterRadius = size / 2;
	const pieRadius = pieOuterRadius - 10;
	const TAU = Math.PI * 2;

	const totalPercentage = modalData.reduce((sum, m) => sum + m.percentage, 0);

	// Pie chart arc calculations
	const pieSegments = useMemo(() => {
		if (!totalPercentage) {
			return [];
		}
		let cumulativePercentage = 0;

		// Start the pie at 12 o'clock and draw clockwise by using a negative TAU
		const startOffset = -Math.PI / 2;

		// Rotate draw order so the largest percentage starts at 12 o'clock.
		const indexed = modalData.map((m, i) => ({ ...m, origIndex: i }));
		if (indexed.length === 0) {
			return [];
		}
		let maxIndex = 0;
		for (let i = 1; i < indexed.length; i++) {
			if (indexed[i].percentage > indexed[maxIndex].percentage) {
				maxIndex = i;
			}
		}
		// Make the largest slice be drawn last so its end angle lands at 12 o'clock
		const drawOrder = [
			...indexed.slice(maxIndex + 1),
			...indexed.slice(0, maxIndex + 1),
		];

		return drawOrder.map((modal) => {
			const segmentPercentage = modal.percentage;
			const startAngle =
				startOffset - (cumulativePercentage / totalPercentage) * TAU;
			const endAngle =
				startOffset -
				((cumulativePercentage + segmentPercentage) / totalPercentage) * TAU;
			const midAngle = (startAngle + endAngle) / 2;
			cumulativePercentage += segmentPercentage;

			const startX = pieCenter + pieRadius * Math.cos(startAngle);
			const startY = pieCenter + pieRadius * Math.sin(startAngle);
			const endX = pieCenter + pieRadius * Math.cos(endAngle);
			const endY = pieCenter + pieRadius * Math.sin(endAngle);
			const largeArcFlag = segmentPercentage / totalPercentage > 0.5 ? 1 : 0;
			const sweepFlag = 0;

			const pathData = [
				`M ${pieCenter} ${pieCenter}`,
				`L ${startX} ${startY}`,
				`A ${pieRadius} ${pieRadius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`,
				"Z",
			].join(" ");

			const labelRadius = pieRadius * 0.65;
			const labelX = pieCenter + labelRadius * Math.cos(midAngle);
			const labelY = pieCenter + labelRadius * Math.sin(midAngle);

			return {
				pathData,
				color: segmentColors[modal.origIndex % segmentColors.length],
				value: modal.percentage,
				name: modal.name,
				labelX,
				labelY,
			};
		});
	}, [modalData, segmentColors, pieCenter, pieRadius, totalPercentage, TAU]);

	// Inline CSS variables to control the animation from props
	const animVars = {
		["--disc-size"]: `${size}px`,
		["--start-left"]: `${startOffsetPx}px`,
		["--move-duration"]: `${animationDurationMs}ms`,
		["--move-delay"]: `${animationDelayMs}ms`,
		["--spin-turns"]: `${turnsWhileMoving}turn`,
		["--spin-turns-final"]: `${Math.round(turnsWhileMoving)}turn`,
		position: "relative",
		left: `${startOffsetPx}px`,
	} as React.CSSProperties;

	const shadowStyles = useMemo(() => {
		const width = size; // 80% of disc width
		const height = size * 0.18; // shallow ellipse
		const blur = Math.max(8, size * 0.03);
		const drop = Math.max(6, size * 0.06); // how far below the disc

		return {
			bottom: `-${drop}px`,
			width: `${width}px`,
			height: `${height * 0.45}px`,
			"--disc-size": `${size}px`,
			"--start-left": `${startOffsetPx}px`,
			"--move-duration": `${animationDurationMs}ms`,
			"--move-delay": `${animationDelayMs}ms`,
			// soft elliptical shadow using a radial gradient (no filter needed)
			background:
				"radial-gradient(ellipse at center, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0) 70%)",
			filter: `blur(${blur}px)`,
		};
	}, [size]);

	return (
		<div
			className="absolute left-16 right-0 bottom-0 -z-10 pointer-events-none"
			style={{ width: `calc(100% - ${size / 3}px)` }}
		>
			{totalPercentage && (
				<>
					{/* DISC SHADOW */}
					<div
						aria-hidden
						style={shadowStyles}
						className={`absolute z-0 left-0 bottom-0 top-full rounded-[50%] opacity-0 ${isAnimationBackwards ? "animate-disc-shadow-backwards" : "animate-disc-shadow-forwards"}`}
					/>
					{/* MODAL DISC */}
					<div
						className={`inline-block ${isAnimationBackwards ? "animate-modal-disc-backwards" : "animate-modal-disc-forwards"}`}
						style={animVars}
						aria-hidden={false}
					>
						<svg
							width={size}
							height={size}
							viewBox={`0 0 ${size} ${size}`}
							role="img"
							aria-label="Traffic modal split pie chart"
						>
							{pieSegments.map((segment) => (
								<g key={segment.name}>
									<path
										d={segment.pathData}
										fill={segment.color}
										stroke="#fff"
										strokeWidth={2}
										strokeLinejoin="round"
									/>
									{/* PERCENTAGE LABEL */}
									<text
										x={segment.labelX}
										y={segment.labelY - 10}
										textAnchor="middle"
										alignmentBaseline="middle"
										fontSize={18}
										fontWeight={600}
										fill={labelColor}
										style={{
											pointerEvents: "none",
											userSelect: "none",
											textShadow: "0 1px 4px rgba(0,0,0,0.25)",
										}}
									>
										{segment.value}%
									</text>
									{/* NAME LABEL */}
									<text
										x={segment.labelX}
										y={segment.labelY + 14}
										textAnchor="middle"
										alignmentBaseline="middle"
										fontSize={13}
										fontWeight={500}
										fill={labelColor}
										style={{
											pointerEvents: "none",
											userSelect: "none",
											textShadow: "0 1px 4px rgba(0,0,0,0.25)",
										}}
									>
										{segment.name}
									</text>
								</g>
							))}
							{/* INNER CIRCLES */}
							{areInnerCirclesVisible && (
								<>
									<circle
										cx={pieCenter}
										cy={pieCenter}
										r={pieRadius * 0.4}
										fill="#000000"
										opacity={1}
									/>
									<circle
										cx={pieCenter}
										cy={pieCenter}
										r={pieRadius * 0.02}
										fill="#fff"
									/>
								</>
							)}
						</svg>
					</div>
					{/* LEGEND */}
					{isLegendVisible && (
						<div className="mt-2 flex justify-between" style={{ width: size }}>
							{modalData.map((modal, idx) => (
								<div
									key={`${modal.name}-${idx}`}
									className="flex-1 text-center text-[12px] font-normal"
									style={{ color: segmentColors[idx % segmentColors.length] }}
								>
									{modal.name}
									<div className="font-medium">{modal.percentage}%</div>
								</div>
							))}
						</div>
					)}
				</>
			)}
		</div>
	);
};
