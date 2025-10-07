import React from "react";

type NoiseChartProps = {
	title: string;
	value: number;
	min?: number;
	max?: number;
	isScaleVisible?: boolean;
	className?: string;
	markerSize?: number;
	markerColor?: string;
	isValueLabelVisible?: boolean;
};

function clamp(n: number, min: number, max: number) {
	return Math.min(Math.max(n, min), max);
}

function pct(value: number, min: number, max: number) {
	const span = Math.max(1e-6, max - min);
	return ((value - min) / span) * 100;
}

export const NoiseChart: React.FC<NoiseChartProps> = ({
	title,
	value,
	min = 10,
	max = 100,
	isScaleVisible = false,
	className = "",
	markerSize = 14,
	markerColor = "bg-white",
	isValueLabelVisible = false,
}) => {
	const [rangeMin, rangeMax] = min < max ? [min, max] : [max, min];
	const clamped = clamp(value, rangeMin, rangeMax);
	const xAxisValue = pct(clamped, rangeMin, rangeMax);

	// Color stops for the gradient
	const greenTo = 60,
		amberTo = 75;
	const greenStopPercent = pct(greenTo, rangeMin, rangeMax);
	const amberStopPercent = pct(amberTo, rangeMin, rangeMax);

	const backgroundImage = `linear-gradient(
        to right,
        rgba(34, 197, 94, 0.8) 0%,      /* green-500 */
        rgba(250, 204, 21, 0.8) ${greenStopPercent}%, /* yellow-400 */
        rgba(249, 115, 22, 0.8) ${amberStopPercent}%, /* orange-500 */
        rgba(239, 68, 68, 0.8) 100%       /* red-500 */
    )`;

	return (
		<section className={`w-full flex flex-col gap-2 p-3.5 ${className}`}>
			<h3 className="font-semibold">{title}</h3>
			<div className="flex justify-between items-center">
				<div className="w-full max-w-md">
					<div
						role="meter"
						aria-label="Noise level"
						aria-valuemin={rangeMin}
						aria-valuemax={rangeMax}
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
								left: `${xAxisValue}%`,
							}}
						/>

						{/* Indicator dot */}
						<div
							className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
							style={{ left: `${xAxisValue}%` }}
						>
							<div
								className={`rounded-full ${markerColor}`}
								style={{ width: markerSize, height: markerSize }}
							/>
						</div>

						{/* Value Label */}
						{isValueLabelVisible && (
							<div
								className={`absolute top-8 mt-1 -translate-y-1/2 text-black text-sm z-20 font-semibold`}
								style={{ left: `calc(${xAxisValue}% - ${markerSize / 2}px)` }}
							>
								{value}
							</div>
						)}
					</div>
					{isScaleVisible && (
						<div className="mt-1 flex justify-between text-sm text-black">
							<span>{rangeMin}</span>
							<span>{rangeMax}</span>
						</div>
					)}
				</div>
				<p className="font-bold self-start">{value} dB</p>
			</div>
		</section>
	);
};

export default NoiseChart;
