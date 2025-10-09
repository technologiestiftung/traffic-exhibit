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
	reorientDurationMs?: number;
	turnsWhileMoving?: number;
	startOffsetPx?: number;
};

export const TrafficModalSplit: React.FC<TrafficModalSplitProps> = ({
	telraamMatch,
	size = 300,
	isLegendVisible = true,
	areInnerCirclesVisible = true,
	segmentColors = ["#4CAF50", "#2196F3", "#FFC107", "#FF5722"],
	labelColor = "#fff",
	animationDurationMs = 1200,
	animationDelayMs = 2000, // match CSS default
	reorientDurationMs = 1000,
	turnsWhileMoving = 3,
	startOffsetPx = 0, // left offset for animation
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

		return modalData.map((modal, index) => {
			const segmentPercentage = modal.percentage;

			const startAngle = (cumulativePercentage / totalPercentage) * TAU;
			const endAngle =
				((cumulativePercentage + segmentPercentage) / totalPercentage) * TAU;
			const midAngle = (startAngle + endAngle) / 2;
			cumulativePercentage += segmentPercentage;

			const startX = pieCenter + pieRadius * Math.cos(startAngle);
			const startY = pieCenter + pieRadius * Math.sin(startAngle);
			const endX = pieCenter + pieRadius * Math.cos(endAngle);
			const endY = pieCenter + pieRadius * Math.sin(endAngle);
			const largeArcFlag = segmentPercentage / totalPercentage > 0.5 ? 1 : 0;

			const pathData = [
				`M ${pieCenter} ${pieCenter}`,
				`L ${startX} ${startY}`,
				`A ${pieRadius} ${pieRadius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
				"Z",
			].join(" ");

			const labelRadius = pieRadius * 0.65;
			const labelX = pieCenter + labelRadius * Math.cos(midAngle);
			const labelY = pieCenter + labelRadius * Math.sin(midAngle);

			return {
				pathData,
				color: segmentColors[index % segmentColors.length],
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
		["--reorient-duration"]: `${reorientDurationMs}ms`,
		["--spin-turns"]: `${turnsWhileMoving}turn`,
		["--spin-turns-final"]: `${Math.round(turnsWhileMoving)}turn`,
		position: "relative",
		left: `${startOffsetPx}px`,
	} as React.CSSProperties;

	return (
		<div className="absolute inset-y-0 left-16 right-0 -z-10 pointer-events-none">
			<div
				className="inline-block animate-modal-disc"
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
					{totalPercentage === 0 ? (
						<text
							x={pieCenter}
							y={pieCenter}
							textAnchor="middle"
							alignmentBaseline="middle"
						>
							No data
						</text>
					) : (
						pieSegments.map((segment) => (
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
						))
					)}
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
		</div>
	);
};
