import React from "react";
import { clamp } from "../match/utils";

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

	// Smooth gradient bar (non-pixelated)
	const backgroundImage =
		"linear-gradient(to right, #dedede 0%, #bdbdbd 30%, #666 70%, #222 100%)";

	return (
		<section className={`w-full flex flex-col gap-2 p-3 ${className}`}>
			<h3 className="font-semibold self-start text-base 2xl:text-xl">
				{title}
			</h3>
			<div className="flex justify-between items-center">
				<div className="w-full max-w-md">
					<div
						role="meter"
						aria-label="Noise level"
						aria-valuemin={rangeMin}
						aria-valuemax={rangeMax}
						aria-valuenow={clamped}
						aria-valuetext={`${Math.round(clamped)} dB`}
						className="relative w-full rounded-sm h-6 overflow-hidden"
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
								className={`${markerColor}`}
								style={{ width: markerSize, height: markerSize }}
							/>
						</div>

						{/* Value Label */}
						{isValueLabelVisible && (
							<div
								className={`absolute top-8 mt-1 -translate-y-1/2 text-black text-sm z-20 font-semibold font-numbers`}
								style={{ left: `calc(${xAxisValue}% - ${markerSize / 2}px)` }}
							>
								{value}
							</div>
						)}
					</div>
					{isScaleVisible && (
						<div className="mt-1 flex justify-between text-sm text-black font-numbers">
							<span>{rangeMin}</span>
							<span>{rangeMax}</span>
						</div>
					)}
				</div>
				<p className="font-bold self-start font-numbers text-base 2xl:text-xl">
					{value} dB
				</p>
			</div>
		</section>
	);
};

export default NoiseChart;
