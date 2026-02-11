import React, { useState, useEffect, useRef } from "react";
import { clamp } from "../match/utils";
import { i18n } from "../../i18n/i18n-utils";

const INITIAL_FILL_DURATION_MS = 1200; // 0 → value on first load
const MIN_DISPLAY_PERCENT = 20; // minimum range so blocks visible when value is 0
const LOOP_RANGE_BLOCKS = 10; // loop in last N blocks (10 blocks = 20%)
const LOOP_BASE_PERIOD_MS = 9000; // base period for loop oscillation (slower = calmer)
const LOOP_PERIOD_VARIANCE_MS = 2500; // random variance so not same every time
const LOOP_NOISE_AMOUNT = 1; // random jitter like real VU meter (±%)
const LOOP_NOISE_SMOOTH = 0.995; // higher = slower, calmer jitter

type NoiseChartProps = {
	title: string;
	value: number;
	min?: number;
	max?: number;
	isScaleVisible?: boolean;
	className?: string;
	isValueLabelVisible?: boolean;
	/** Animation duration in ms for the fill/needle */
	animationDurationMs?: number;
};

const VU_RANGE_MIN = 0;
const VU_RANGE_MAX = 100;

export const NoiseChart: React.FC<NoiseChartProps> = ({
	title,
	value,
	min: _min = VU_RANGE_MIN,
	max: _max = VU_RANGE_MAX,
	isScaleVisible = true,
	className = "",
	isValueLabelVisible = true,
	animationDurationMs = 400,
}) => {
	const [rangeMin, rangeMax] = [VU_RANGE_MIN, VU_RANGE_MAX];
	const clamped = clamp(value, rangeMin, rangeMax);
	const fillPercent = Math.max(
		0,
		Math.min(100, ((clamped - rangeMin) / (rangeMax - rangeMin)) * 100),
	);
	const BLOCKS = 50; // one block per 2%
	const blockColors: string[] = [
		...Array(15).fill("#22c55e"), // 0–30% green
		...Array(10).fill("#eab308"), // 30–50% yellow
		...Array(5).fill("#f59e0b"), // 50–60% orange
		...Array(20).fill("#dc2626"), // 60–100% red
	];

	// Phase 1: 0 → value. Phase 2: loop in last LOOP_RANGE_BLOCKS with random variation
	const [displayPercent, setDisplayPercent] = useState(MIN_DISPLAY_PERCENT / 2);
	const startTimeRef = useRef<number | null>(null);
	const rafRef = useRef<number | null>(null);
	const fillPercentRef = useRef(fillPercent);
	const phaseRef = useRef<"initial" | "loop">("initial");
	const noiseRef = useRef(0);
	const loopPhaseRef = useRef(0);
	const lastNowRef = useRef<number | null>(null);
	fillPercentRef.current = fillPercent;

	useEffect(() => {
		startTimeRef.current = null;
		phaseRef.current = "initial";
		noiseRef.current = 0;
		loopPhaseRef.current = 0;
		lastNowRef.current = null;

		const tick = (now: number) => {
			if (startTimeRef.current === null) {
				startTimeRef.current = now;
			}
			const elapsed = now - startTimeRef.current;
			const targetPercent = Math.max(
				MIN_DISPLAY_PERCENT,
				fillPercentRef.current,
			);
			const loopRangePercent = LOOP_RANGE_BLOCKS * 2; // N blocks * 2% each

			if (phaseRef.current === "initial") {
				const t = Math.min(1, elapsed / INITIAL_FILL_DURATION_MS);
				const easeOut = 1 - (1 - t) * (1 - t); // ease-out quad
				const percent = targetPercent * easeOut;
				setDisplayPercent(percent);
				if (t >= 1) {
					phaseRef.current = "loop";
					lastNowRef.current = now;
				}
			} else {
				const loopMin = Math.max(0, targetPercent - loopRangePercent);
				const loopMax = targetPercent;
				const halfRange = (loopMax - loopMin) / 2;
				const mid = loopMin + halfRange;
				const deltaMs =
					lastNowRef.current !== null ? now - lastNowRef.current : 16;
				lastNowRef.current = now;
				const period =
					LOOP_BASE_PERIOD_MS +
					Math.sin(now * 0.0008) * LOOP_PERIOD_VARIANCE_MS;
				loopPhaseRef.current += (deltaMs / period) * 2 * Math.PI;
				const cycle = loopPhaseRef.current;
				const base = mid + halfRange * Math.sin(cycle);
				noiseRef.current =
					noiseRef.current * LOOP_NOISE_SMOOTH +
					(Math.random() - 0.5) * 2 * LOOP_NOISE_AMOUNT;
				noiseRef.current = Math.max(
					-LOOP_NOISE_AMOUNT * 2,
					Math.min(LOOP_NOISE_AMOUNT * 2, noiseRef.current),
				);
				const percent = Math.max(0, Math.min(100, base + noiseRef.current));
				setDisplayPercent(percent);
			}

			rafRef.current = requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);
		return () => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
			}
		};
	}, []);

	return (
		<section className={`w-full flex flex-col gap-2 p-3 ${className}`}>
			<h3 className="font-semibold self-start text-base 2xl:text-xl">
				{title}
			</h3>
			<div className="flex flex-col gap-2 w-full">
				{/* Horizontal VU meter: 50 blocks (2% each), unfilled blocks invisible */}
				<div
					role="meter"
					aria-label="Noise level"
					aria-valuemin={rangeMin}
					aria-valuemax={rangeMax}
					aria-valuenow={clamped}
					aria-valuetext={`${Math.round(clamped)} dB`}
					className="flex w-full gap-0.5 sm:gap-1 bg-black p-0.5 sm:p-1"
				>
					{Array.from({ length: BLOCKS }, (_, i) => {
						const threshold = (i + 1) * 2;
						const isOn = displayPercent >= threshold;
						return (
							<div
								key={i}
								className="flex-1 h-6 sm:h-8"
								style={{
									backgroundColor: isOn ? blockColors[i] : "transparent",
									boxShadow: isOn ? `0 0 8px ${blockColors[i]}40` : "none",
								}}
							/>
						);
					})}
				</div>
				{(isScaleVisible || isValueLabelVisible) && (
					<div className="relative flex justify-between items-baseline text-xs w-full min-h-[1.25rem]">
						{isScaleVisible && (
							<span className="text-neutral-500 z-0">
								{i18n("noiseChart.scale.quiet")}
							</span>
						)}
						{isValueLabelVisible && (
							<span
								className="absolute font-bold font-numbers tabular-nums z-10 ease-out"
								style={{
									left: `${fillPercent}%`,
									transform: "translateX(-50%)",
									transition: `left ${animationDurationMs}ms ease-out`,
								}}
							>
								{Math.round(clamped)} dB
							</span>
						)}
						{isScaleVisible && (
							<span className="text-neutral-500 z-0">
								{i18n("noiseChart.scale.loud")}
							</span>
						)}
					</div>
				)}
			</div>
		</section>
	);
};

export default NoiseChart;
