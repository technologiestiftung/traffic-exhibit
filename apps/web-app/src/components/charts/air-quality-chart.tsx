import * as React from "react";
import { i18n } from "../../i18n/i18n-utils";

type AirQualityStep = {
	label: string;
	value: number;
};

const AIR_QUALITY_STEPS: AirQualityStep[] = [
	{
		label: i18n("airQualityChart.step.veryLow"),
		value: 1,
	},
	{
		label: i18n("airQualityChart.step.low"),
		value: 2,
	},
	{
		label: i18n("airQualityChart.step.moderate"),
		value: 3,
	},
	{
		label: i18n("airQualityChart.step.elevated"),
		value: 4,
	},
	{
		label: i18n("airQualityChart.step.high"),
		value: 5,
	},
];

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n));
}

function stepFor(value: number): AirQualityStep {
	const v = clamp(value, 1, 5);
	return (
		AIR_QUALITY_STEPS.find((s) => v === s.value) ??
		AIR_QUALITY_STEPS[AIR_QUALITY_STEPS.length - 1]
	);
}

export type AirQualityChartProps = {
	title: string;
	value: number;
	className?: string;
	height?: string;
	markerSize?: number;
	isScaleVisible?: boolean;
	markerColor?: string;
	isValueLabelVisible?: boolean;
};

export const AirQualityChart: React.FC<AirQualityChartProps> = ({
	title,
	value,
	className = "",
	height = "h-3",
	markerSize = 14,
	isScaleVisible = false,
	markerColor = "bg-white",
	isValueLabelVisible = false,
}) => {
	const v = clamp(value, 1, 5);

	// Calculate the position of the marker in the middle of the current step
	const markerPositionPercent = ((v - 1 + 0.5) / 5) * 100; // Middle of the current step (0.5 added to offset to middle)

	const currentStep = stepFor(v);

	// Gradient with distinct color bands and white lines between each segment
	const gradient =
		"linear-gradient(to right," +
		" rgba(16,185,129,0.8) 0%, " + // Green (Sehr niedrig)
		" rgba(16,185,129,0.8) 20%, " +
		" rgba(250,204,21,0.8) 20%, " + // Yellow (Niedrig)
		" rgba(250,204,21,0.8) 40%, " +
		" rgba(253,100,40,0.8) 40%, " + // Orange (Mäßig)
		" rgba(253,100,40,0.8) 60%, " +
		" rgba(253,30,30,0.8) 60%, " + // Red (Erhöht)
		" rgba(253,30,30,0.8) 80%, " +
		" rgba(124,45,18,0.8) 80%, " + // Dark red (Hoch)
		" rgba(124,45,18,0.8) 100%)"; // Darkest red (Kritisch)

	return (
		<section
			className={`w-full flex flex-col gap-2 p-3.5 ${className}`}
			aria-label={`Air Quality: ${currentStep.label}`}
		>
			<h3 className="font-semibold">{title}</h3>
			<div className="flex justify-between items-center">
				<div className="relative w-full max-w-md">
					<div
						role="meter"
						aria-valuemin={1}
						aria-valuemax={5}
						aria-valuenow={v}
						aria-valuetext={`${currentStep.label}`}
						className={`relative w-full rounded-sm h-6 overflow-hidden ${height}`}
						style={{ background: gradient }}
					>
						{/* White lines between segments */}
						{[1, 2, 3, 4].map((i) => (
							<div
								key={i}
								className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
								style={{
									left: `${(i / 5) * 100}%`,
								}}
							/>
						))}
						{/* Indicator line */}
						<div
							className={`absolute top-0 bottom-0 -translate-x-1/2 w-0.5 ${markerColor} z-10`}
							style={{
								left: `${markerPositionPercent}%`,
							}}
						/>
						{/* Marker */}
						<div
							className="absolute top-1/2 -translate-y-1/2"
							style={{
								left: `calc(${markerPositionPercent}% - ${markerSize / 2}px)`,
							}}
						>
							<div
								className={`rounded-full ${markerColor}`}
								style={{ width: markerSize, height: markerSize }}
								aria-hidden
							/>
						</div>
					</div>
					{isScaleVisible && (
						<div className="mt-1 flex justify-between text-sm text-black">
							<span>1</span>
							<span>5</span>
						</div>
					)}
					{/* Value Label */}
					{isValueLabelVisible && (
						<div
							className={`absolute top-8 mt-1 -translate-y-1/2 text-black text-sm z-20 font-semibold`}
							style={{
								left: `calc(${markerPositionPercent}% - ${markerSize / 2}px)`,
							}}
						>
							{value}
						</div>
					)}
				</div>
				{/* Value label*/}
				<div className="h-fit self-start text-black font-bold">
					{!isValueLabelVisible && value} {currentStep.label}
				</div>
			</div>
		</section>
	);
};
