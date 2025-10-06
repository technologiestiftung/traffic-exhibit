import React from "react";

type NoiseChartProps = {
	value: number;
	min?: number;
	max?: number;
	isScaleVisible?: boolean;
	className?: string;
	markerSize?: number;
	markerColor?: string;
};

function clamp(n: number, min: number, max: number) {
	return Math.min(Math.max(n, min), max);
}

function pct(value: number, min: number, max: number) {
	const span = Math.max(1e-6, max - min);
	return ((value - min) / span) * 100;
}

export const NoiseChart: React.FC<NoiseChartProps> = ({
	value,
	min = 10,
	max = 100,
	isScaleVisible = false,
	className = "",
	markerSize = 14,
	markerColor = "bg-white",
}) => {
	const [rMin, rMax] = min < max ? [min, max] : [max, min];
	const clamped = clamp(value, rMin, rMax);
	const x = pct(clamped, rMin, rMax);

	// Fixed visuals (grayscale gradient + comfort bands)
	const greenTo = 60,
		amberTo = 75;
	const gPct = pct(greenTo, rMin, rMax);
	const aPct = pct(amberTo, rMin, rMax);

	const backgroundImage = `linear-gradient(
        to right,
        rgba(34, 197, 94, 0.8) 0%,      /* green-500 */
        rgba(250, 204, 21, 0.8) ${gPct}%, /* yellow-400 */
        rgba(249, 115, 22, 0.8) ${aPct}%, /* orange-500 */
        rgba(239, 68, 68, 0.8) 100%       /* red-500 */
    )`;

	return (
		<div className={`w-full ${className}`}>
			<div
				role="meter"
				aria-label="Noise level"
				aria-valuemin={rMin}
				aria-valuemax={rMax}
				aria-valuenow={clamped}
				aria-valuetext={`${Math.round(clamped)} dB`}
				className="relative w-full rounded-sm h-6"
				style={{
					backgroundImage,
					backgroundSize: "100% 100%",
					backgroundRepeat: "no-repeat",
				}}
			>
				{/* Indicator line */}
				<div
					className={`absolute top-0 bottom-0 -translate-x-1/2 w-0.5 ${markerColor} z-10`}
					style={{
						left: `${x}%`,
					}}
				/>

				{/* Indicator dot */}
				<div
					className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
					style={{ left: `${x}%` }}
				>
					<div
						className={`rounded-full ${markerColor}`}
						style={{ width: markerSize, height: markerSize }}
					/>
				</div>
			</div>

			{isScaleVisible && (
				<div className="mt-1 flex justify-between text-xs text-gray-600">
					<span>{rMin}</span>
					<span>{rMax}</span>
				</div>
			)}
		</div>
	);
};

export default NoiseChart;
