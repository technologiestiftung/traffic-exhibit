import React, { useState, useEffect, useRef } from "react";
import { clamp } from "../match/utils";
import { i18n } from "../../i18n/i18n-utils";

const INITIAL_FILL_DURATION_MS = 1200; // 0 → value on first load
const MIN_DISPLAY_PERCENT = 20; // minimum range so blocks visible when value is 0
const LOOP_OVERSHOOT_PERCENT = 6; // jitter/pulse can go this much above current value (e.g. 3 blocks)
const LOOP_SINE_AMPLITUDE_BLOCKS = 1; // sine wave moves only this many blocks (less = calmer)
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
	animationDurationMs: _animationDurationMs = 400,
}) => {
	const [rangeMin, rangeMax] = [VU_RANGE_MIN, VU_RANGE_MAX];
	const clamped = clamp(value, rangeMin, rangeMax);
	const fillPercent = Math.max(
		0,
		Math.min(100, ((clamped - rangeMin) / (rangeMax - rangeMin)) * 100),
	);
	const COLS = 3;
	const ROWS = 20; // each row = 5% of 100%
	const ROW_PERCENT = 5;
	const FILLED_COLOR = "#000";
	const GRID_BG = "transparent";
	const GAP = 2;
	const PAD = 2;
	const CELL_SIZE = 10;
	const GRID_WIDTH = COLS * CELL_SIZE + (COLS - 1) * GAP + PAD * 2;
	const GRID_HEIGHT = ROWS * CELL_SIZE + (ROWS - 1) * GAP + PAD * 2;

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
				// Center oscillation on current value; jitter can exceed it so it looks "around" the value
				const sineHalfAmplitudePercent = LOOP_SINE_AMPLITUDE_BLOCKS * 2 * 0.5; // ±N blocks
				const deltaMs =
					lastNowRef.current !== null ? now - lastNowRef.current : 16;
				lastNowRef.current = now;
				const period =
					LOOP_BASE_PERIOD_MS +
					Math.sin(now * 0.0008) * LOOP_PERIOD_VARIANCE_MS;
				loopPhaseRef.current += (deltaMs / period) * 2 * Math.PI;
				const cycle = loopPhaseRef.current;
				// Base fill level = current value; sine + jitter oscillate around it (can exceed above)
				const base = targetPercent + sineHalfAmplitudePercent * Math.sin(cycle);
				noiseRef.current =
					noiseRef.current * LOOP_NOISE_SMOOTH +
					(Math.random() - 0.5) * 2 * LOOP_NOISE_AMOUNT;
				noiseRef.current = Math.max(
					-LOOP_NOISE_AMOUNT * 2,
					Math.min(LOOP_NOISE_AMOUNT * 2, noiseRef.current),
				);
				const raw = base + noiseRef.current;
				const maxPercent = Math.min(
					100,
					targetPercent + LOOP_OVERSHOOT_PERCENT,
				);
				const percent = Math.max(0, Math.min(maxPercent, raw));
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
			<h3 className="font-normal self-start text-base 2xl:text-xl">
				{title}{" "}
				<span className="font-semibold">({Math.round(clamped)} dB)</span>
			</h3>
			<div className="flex items-start gap-3 w-full">
				{/* Vertical grid: 3 columns × 20 rows, fill from bottom, transparent bg, black cells */}
				<div className="flex flex-col gap-0.5 sm:gap-1 items-center shrink-0">
					{isScaleVisible && (
						<span className="text-xs text-neutral-700 h-4 flex items-center">
							{i18n("noiseChart.scale.loud")}
						</span>
					)}
					<div
						role="meter"
						aria-label="Noise level"
						aria-valuemin={rangeMin}
						aria-valuemax={rangeMax}
						aria-valuenow={clamped}
						aria-valuetext={`${Math.round(clamped)} dB`}
						className="grid overflow-hidden shrink-0"
						style={{
							width: GRID_WIDTH,
							height: GRID_HEIGHT,
							padding: PAD,
							gap: GAP,
							gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`,
							gridTemplateRows: `repeat(${ROWS}, ${CELL_SIZE}px)`,
							backgroundColor: GRID_BG,
						}}
					>
						{Array.from({ length: ROWS }, (_, row) =>
							Array.from({ length: COLS }, (_unused, c) => {
								const i = row * COLS + c;
								const threshold = (ROWS - row) * ROW_PERCENT;
								const isOn = displayPercent >= threshold;
								return (
									<div
										key={i}
										className="min-h-0 min-w-0 box-border border border-black"
										style={{
											backgroundColor: isOn ? FILLED_COLOR : GRID_BG,
										}}
									/>
								);
							}),
						)}
					</div>
					{isScaleVisible && (
						<span className="text-xs text-neutral-700 h-4 flex items-center">
							{i18n("noiseChart.scale.quiet")}
						</span>
					)}
				</div>
				{/* Value label: aligned with fill level */}
				{isValueLabelVisible && (
					<div className="flex flex-col gap-0.5 sm:gap-1 shrink-0">
						{isScaleVisible && (
							<span className="text-xs invisible h-4">
								{i18n("noiseChart.scale.loud")}
							</span>
						)}

						{isScaleVisible && (
							<span className="text-xs invisible h-4">
								{i18n("noiseChart.scale.quiet")}
							</span>
						)}
					</div>
				)}
			</div>
		</section>
	);
};

export default NoiseChart;
