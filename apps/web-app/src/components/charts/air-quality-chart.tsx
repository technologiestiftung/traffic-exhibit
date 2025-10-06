import * as React from "react";

type AqiBand = {
	min: number;
	max: number;
	len: number; // visual width on the 0–500 scale
};

const AQI_BANDS: AqiBand[] = [
	{
		min: 0,
		max: 50,
		len: 50,
	},
	{
		min: 51,
		max: 100,
		len: 50,
	},
	{
		min: 101,
		max: 150,
		len: 50,
	},
	{
		min: 151,
		max: 200,
		len: 50,
	},
	{
		min: 201,
		max: 300,
		len: 100,
	},
	{
		min: 301,
		max: 500,
		len: 200,
	},
];

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n));
}

function bandFor(value: number): AqiBand {
	const v = clamp(value, 0, 500);
	return (
		AQI_BANDS.find((b) => v >= b.min && v <= b.max) ??
		AQI_BANDS[AQI_BANDS.length - 1]
	);
}

export type AirQualityChartProps = {
	value: number;
	className?: string;
	height?: string;
	markerSize?: number;
	isScaleVisible?: boolean;
	markerColor?: string;
};

export const AirQualityChart: React.FC<AirQualityChartProps> = ({
	value,
	className = "",
	height = "h-3",
	markerSize = 14,
	isScaleVisible = false,
	markerColor = "bg-white",
}) => {
	const v = clamp(value, 0, 500);
	const pct = (v / 500) * 100;
	const curr = bandFor(v);

	// Smooth gradient with stops roughly aligned to EPA breakpoints:
	// 0 (0%) → 100 (20%) → 150 (30%) → 200 (40%) → 300 (60%) → 500 (100%)
	// Colors: green → yellow → orange → red → deeper red → brown
	const gradient =
		"linear-gradient(to right," +
		" rgba(16,185,129,0.8) 0%," + // green
		" rgba(250,204,21,0.8) 20%," + // yellow
		" rgba(253,186,116,0.8) 30%," + // orange (pastel)
		" rgba(239,68,68,0.8) 40%," + // red
		" rgba(124,45,18,0.8) 100%)"; // brownish ("hazardous")

	return (
		<section
			className={`w-full ${className}`}
			aria-label={`AQI ${v} (${curr.min}-${curr.max})`}
		>
			<div
				role="meter"
				aria-valuemin={0}
				aria-valuemax={500}
				aria-valuenow={v}
				aria-valuetext={`${curr.min}-${curr.max}`}
				className={`relative w-full rounded-sm h-6 overflow-hidden ${height}`}
				style={{ background: gradient }}
			>
				{/* Band boundary ticks */}
				<div
					className={`absolute top-0 bottom-0 -translate-x-1/2 w-0.5 ${markerColor} z-10`}
					style={{
						left: `${pct}%`,
					}}
				/>
				{/* Marker */}
				<div
					className="absolute top-1/2 -translate-y-1/2"
					style={{ left: `calc(${pct}% - ${markerSize / 2}px)` }}
				>
					<div
						className={`rounded-full ${markerColor}`}
						style={{ width: markerSize, height: markerSize }}
						aria-hidden
					/>
				</div>
			</div>
			{isScaleVisible && (
				<div className="mt-1 flex justify-between text-[10px] text-gray-500">
					<span>0</span>
					<span>500</span>
				</div>
			)}
		</section>
	);
};
