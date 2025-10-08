import React, {
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
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
};

export const TrafficModalSplit: React.FC<TrafficModalSplitProps> = ({
	telraamMatch,
	size = 300,
	isLegendVisible = true,
	areInnerCirclesVisible = true,
	segmentColors = ["#4CAF50", "#2196F3", "#FFC107", "#FF5722"],
	labelColor = "#fff",
	animationDurationMs = 1200,
	animationDelayMs = 2000,
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

	// Measure the available width of the overlay layer (between left-16 and right-0)
	const overlayLayerRef = useRef<HTMLDivElement | null>(null);
	const [overlayLayerWidth, setOverlayLayerWidth] = useState<number | null>(
		null,
	);

	// Track width changes
	useLayoutEffect(() => {
		if (!overlayLayerRef.current) {
			return undefined;
		}
		const resizeObserver = new ResizeObserver(([entry]) => {
			setOverlayLayerWidth(entry.contentRect.width);
		});
		resizeObserver.observe(overlayLayerRef.current);
		return () => {
			resizeObserver.disconnect();
		};
	}, []);

	const movingElementRef = useRef<HTMLDivElement | null>(null);

	// Animate by mutating the element style (no React re-renders per frame)
	useEffect(() => {
		if (overlayLayerWidth === null || !movingElementRef.current) {
			return undefined;
		}

		const prefersReducedMotion =
			typeof window !== "undefined" &&
			window.matchMedia &&
			window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		const movementStartX = (1 / 3) * size;
		const movementEndX = overlayLayerWidth - size;
		const travelDistanceX = Math.max(movementEndX - movementStartX, 0);

		// Reset transform to the starting position
		movingElementRef.current.style.transform = `translateX(${movementStartX}px) rotate(0deg)`;

		if (prefersReducedMotion || travelDistanceX === 0) {
			return undefined;
		}

		let animationStartTimestamp: number | null = null;
		let rafId = 0;

		const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

		const step = (timestampMs: number) => {
			if (animationStartTimestamp === null) {
				animationStartTimestamp = timestampMs;
			}

			const rawProgress = Math.min(
				(timestampMs - animationStartTimestamp) / animationDurationMs,
				1,
			);
			const easedProgress = easeOutCubic(rawProgress);

			const currentTranslateX =
				movementStartX + travelDistanceX * easedProgress;

			// rotation ≈ (linear distance / radius) in radians → convert to degrees
			const rotationRadians =
				(currentTranslateX - movementStartX) / pieOuterRadius;
			const rotationDegrees = (rotationRadians * 180) / Math.PI;

			if (movingElementRef.current) {
				movingElementRef.current.style.transform = `translateX(${currentTranslateX}px) rotate(${rotationDegrees}deg)`;
			}

			if (rawProgress < 1) {
				rafId = requestAnimationFrame(step);
			}
		};

		const timeoutId = window.setTimeout(() => {
			rafId = requestAnimationFrame(step);
		}, animationDelayMs);

		return () => {
			window.clearTimeout(timeoutId);
			cancelAnimationFrame(rafId);
		};
	}, [
		overlayLayerWidth,
		size,
		animationDelayMs,
		animationDurationMs,
		pieOuterRadius,
	]);

	return (
		<div
			ref={overlayLayerRef}
			className="absolute inset-y-0 left-16 right-0 -z-10 pointer-events-none"
		>
			<div
				ref={movingElementRef}
				className="inline-block will-change-transform"
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
