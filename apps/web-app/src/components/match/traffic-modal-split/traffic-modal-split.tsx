import React, { useEffect, useLayoutEffect } from "react";
import type { TelraamMatch } from "../../../../../api/src/common";
import { getTrafficModal } from "../utils";

const ANIMATION_DURATION_MS = 1200;
const ANIMATION_DELAY_MS = 3000;

type TrafficModalSplitProps = {
	telraamMatch: TelraamMatch;
	size?: number;
	isLegendVisible?: boolean;
	areInnerCirclesVisible?: boolean;
	segmentColors?: string[];
	labelColor?: string;
};

export const TrafficModalSplit: React.FC<TrafficModalSplitProps> = ({
	telraamMatch,
	size = 300,
	isLegendVisible = true,
	areInnerCirclesVisible = true,
	segmentColors = ["#4CAF50", "#2196F3", "#FFC107", "#FF5722"],
	labelColor = "#fff",
}) => {
	const trafficModalSplitData = getTrafficModal(telraamMatch);
	const pieRadius = size / 2 - 10;
	const pieCenter = size / 2;
	const pieOuterRadius = size / 2;

	// Pie chart arc calculation
	let cumulativePercentage = 0;
	const totalPercentage = trafficModalSplitData.reduce(
		(sum, modal) => sum + modal.percentage,
		0,
	);
	const pieSegments = trafficModalSplitData.map((modal, idx) => {
		const segmentPercentage = modal.percentage;
		const startAngle = (cumulativePercentage / totalPercentage) * 2 * Math.PI;
		const endAngle =
			((cumulativePercentage + segmentPercentage) / totalPercentage) *
			2 *
			Math.PI;
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

		// Label position (move towards center for better visibility)
		const labelRadius = pieRadius * 0.65;
		const labelX = pieCenter + labelRadius * Math.cos(midAngle);
		const labelY = pieCenter + labelRadius * Math.sin(midAngle);

		return {
			pathData,
			color: segmentColors[idx],
			value: modal.percentage,
			name: modal.name,
			labelX,
			labelY,
		};
	});

	// Overlay layer ref to measure width between left-16 and right-0
	const overlayLayerRef = React.useRef<HTMLDivElement | null>(null);
	const [overlayWidth, setOverlayWidth] = React.useState<number | null>(null);

	useLayoutEffect(() => {
		if (!overlayLayerRef.current) {
			return;
		}
		const resizeObserver = new ResizeObserver(([entry]) => {
			setOverlayWidth(entry.contentRect.width);
		});
		resizeObserver.observe(overlayLayerRef.current);
		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	const animationStartX = (1 / 3) * size;
	const animationEndX = overlayWidth !== null ? overlayWidth - size : 0;

	const [currentTranslateX, setCurrentTranslateX] =
		React.useState(animationStartX);
	const [currentRotation, setCurrentRotation] = React.useState(0);

	useEffect(() => {
		if (overlayWidth === null) {
			return;
		}

		let animationFrameId: number;
		let animationStartTime: number | null = null;

		const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

		function animatePie(ts: number) {
			if (animationStartTime === null) {
				animationStartTime = ts;
			}
			const progress = Math.min(
				(ts - animationStartTime) / ANIMATION_DURATION_MS,
				1,
			);
			const easedProgress = easeOutCubic(progress);

			// LEFT -> RIGHT
			const newTranslateX =
				animationStartX + (animationEndX - animationStartX) * easedProgress;
			setCurrentTranslateX(newTranslateX);

			// Wheel-like rotation => clockwise.
			const distance = newTranslateX - animationStartX;
			const rotationDeg = (distance / pieOuterRadius) * (180 / Math.PI);
			setCurrentRotation(rotationDeg);

			if (progress < 1) {
				animationFrameId = requestAnimationFrame(animatePie);
			}
		}

		// reset & go
		setCurrentTranslateX(animationStartX);
		setCurrentRotation(0);
		const animationTimeout = setTimeout(() => {
			animationFrameId = requestAnimationFrame(animatePie);
		}, ANIMATION_DELAY_MS);

		return () => {
			clearTimeout(animationTimeout);
			cancelAnimationFrame(animationFrameId);
		};
	}, [overlayWidth, size]);

	return (
		<div
			ref={overlayLayerRef}
			className="absolute inset-y-0 left-16 right-0 -z-10"
			style={{ pointerEvents: "none" }}
		>
			<div
				style={{
					display: "inline-block",
					transform: `translateX(${currentTranslateX}px) rotate(${currentRotation}deg)`,
					willChange: "transform",
				}}
			>
				<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
					{pieSegments.map((segment) => (
						<g key={segment.name}>
							<path
								d={segment.pathData}
								fill={segment.color}
								stroke="#fff"
								strokeWidth={2}
							/>
							{/* Percentage Labels */}
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
							{/* Labels */}
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
								fill="#00000"
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
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						width: size,
						marginTop: 8,
					}}
				>
					{trafficModalSplitData.map((modal, idx) => (
						<div
							key={modal.name}
							style={{
								textAlign: "center",
								flex: 1,
								color: segmentColors[idx],
								fontSize: 12,
							}}
						>
							{modal.name}
							<div style={{ fontWeight: 500 }}>{modal.percentage}%</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
