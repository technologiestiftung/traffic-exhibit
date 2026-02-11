import React, { useState, useEffect, useRef } from "react";
import { clamp } from "../match/utils";
import { i18n } from "../../i18n/i18n-utils";

const INITIAL_FILL_DURATION_MS = 1200; // 0 → value on first load (per row)
const INITIAL_FILL_STAGGER_MS = 280; // delay before each row starts filling (row 0 first, then 1, then 2)
const MIN_DISPLAY_PERCENT = 20; // minimum range so blocks visible when value is 0
const ROW_LEVEL_OFFSET_PERCENT = 6; // each row sits slightly below the previous (row 0 = full, row 1 = -6%, row 2 = -12%)
const LOOP_OVERSHOOT_PERCENT = 8; // bounce can go this much above current value
const LOOP_DIP_PERCENT = 4; // bounce stays within this much below value (doesn't go down too much)
const LOOP_SINE_AMPLITUDE_PERCENT = 12; // bounce range above value (one-sided)
const LOOP_BASE_PERIOD_MS = 2500; // one full bounce cycle
const LOOP_PERIOD_VARIANCE_MS = 400; // slight variance
const LOOP_NOISE_AMOUNT = 1; // small jitter (±%)
const LOOP_NOISE_SMOOTH = 0.995; // higher = slower, calmer jitter
const ROW_SINE_AMPLITUDE_PERCENT = 3; // per-row bounce offset
const ROW_NOISE_AMOUNT = 1; // per-row jitter (±%)
/** Set to true to add random jitter and per-row noise to the fill level. */
const IS_JITTER_ENABLED = true;

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
	isValueLabelVisible: _isValueLabelVisible = true,
	animationDurationMs: _animationDurationMs = 400,
}) => {
	const [rangeMin, rangeMax] = [VU_RANGE_MIN, VU_RANGE_MAX];
	const clamped = clamp(value, rangeMin, rangeMax);
	const fillPercent = Math.max(
		0,
		Math.min(100, ((clamped - rangeMin) / (rangeMax - rangeMin)) * 100),
	);
	const COLS = 20; // each column = 5% of 100%, fill left → right
	const ROWS = 3;
	const COL_PERCENT = 5;
	const FILLED_COLOR = "#000";
	const GRID_BG = "transparent";
	const GAP = 2;
	const PAD = 2;

	// Phase 1: 0 → value. Phase 2: loop with sine + jitter; each row has its own offset/jitter
	const [displayPercentByRow, setDisplayPercentByRow] = useState<number[]>(() =>
		Array(ROWS).fill(0),
	);
	const startTimeRef = useRef<number | null>(null);
	const rafRef = useRef<number | null>(null);
	const fillPercentRef = useRef(fillPercent);
	const phaseRef = useRef<"initial" | "loop">("initial");
	const noiseRef = useRef(0);
	const loopPhaseRef = useRef(0);
	const lastNowRef = useRef<number | null>(null);
	const rowNoiseRef = useRef<number[]>(Array(ROWS).fill(0));
	const rowPhaseOffsetRef = useRef<number[]>(
		Array.from({ length: ROWS }, (_, i) => (i / ROWS) * 2 * Math.PI),
	);
	fillPercentRef.current = fillPercent;

	useEffect(() => {
		startTimeRef.current = null;
		phaseRef.current = "initial";
		setDisplayPercentByRow(Array(ROWS).fill(0));
		noiseRef.current = 0;
		loopPhaseRef.current = 0;
		lastNowRef.current = null;
		rowNoiseRef.current = Array(ROWS).fill(0);

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
				const nextByRow = Array.from({ length: ROWS }, (_, row) => {
					const rowElapsed = elapsed - row * INITIAL_FILL_STAGGER_MS;
					const t = Math.min(
						1,
						Math.max(0, rowElapsed / INITIAL_FILL_DURATION_MS),
					);
					const easeOut = 1 - (1 - t) * (1 - t);
					return targetPercent * easeOut;
				});
				setDisplayPercentByRow(nextByRow);
				const totalInitialMs =
					INITIAL_FILL_DURATION_MS + (ROWS - 1) * INITIAL_FILL_STAGGER_MS;
				if (elapsed >= totalInitialMs) {
					phaseRef.current = "loop";
					lastNowRef.current = now;
				}
			} else {
				const jitterOn = IS_JITTER_ENABLED;
				const deltaMs =
					lastNowRef.current !== null ? now - lastNowRef.current : 16;
				lastNowRef.current = now;
				const periodMs =
					LOOP_BASE_PERIOD_MS +
					Math.sin(now * 0.0008) * LOOP_PERIOD_VARIANCE_MS;
				loopPhaseRef.current += (deltaMs / periodMs) * 2 * Math.PI;
				const cycle = loopPhaseRef.current;

				if (jitterOn) {
					noiseRef.current =
						noiseRef.current * LOOP_NOISE_SMOOTH +
						(Math.random() - 0.5) * 2 * LOOP_NOISE_AMOUNT;
					noiseRef.current = Math.max(
						-LOOP_NOISE_AMOUNT * 2,
						Math.min(LOOP_NOISE_AMOUNT * 2, noiseRef.current),
					);
				}
				const mainNoise = jitterOn ? noiseRef.current : 0;
				// Bounce above the value: sine adds 0..amplitude (doesn't go down much)
				const bounceUp =
					LOOP_SINE_AMPLITUDE_PERCENT * (0.5 + 0.5 * Math.sin(cycle));
				const base = targetPercent + bounceUp;
				const minPercent = Math.max(0, targetPercent - LOOP_DIP_PERCENT);
				const maxPercent = Math.min(
					100,
					targetPercent + LOOP_OVERSHOOT_PERCENT,
				);

				const nextByRow = rowNoiseRef.current.map((nr, row) => {
					const rowLevelOffset = -row * ROW_LEVEL_OFFSET_PERCENT;
					const rowBase = base + rowLevelOffset;
					const rowPhase = cycle + rowPhaseOffsetRef.current[row];
					// Per-row bounce also one-sided (only adds a little)
					const rowBounce =
						ROW_SINE_AMPLITUDE_PERCENT * (0.5 + 0.5 * Math.sin(rowPhase));
					let rowNoise = 0;
					if (jitterOn) {
						rowNoise =
							nr * LOOP_NOISE_SMOOTH +
							(Math.random() - 0.5) * 2 * ROW_NOISE_AMOUNT;
						rowNoise = Math.max(
							-ROW_NOISE_AMOUNT * 2,
							Math.min(ROW_NOISE_AMOUNT * 2, rowNoise),
						);
						rowNoiseRef.current[row] = rowNoise;
					}
					const raw = rowBase + rowBounce + mainNoise + rowNoise;
					return Math.max(minPercent, Math.min(maxPercent, raw));
				});
				setDisplayPercentByRow(nextByRow);
			}

			rafRef.current = requestAnimationFrame(tick);
		};
		rafRef.current = requestAnimationFrame(tick);
		return () => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
			}
		};
	}, [fillPercent]);

	return (
		<section className={`w-full flex flex-col gap-2 p-3 ${className}`}>
			<h3 className="font-normal self-start text-base 2xl:text-xl">
				{title}{" "}
				<span className="font-semibold">({Math.round(clamped)} dB)</span>
			</h3>
			<div className="flex flex-col gap-1 w-full">
				<div
					role="meter"
					aria-label="Noise level"
					aria-valuemin={rangeMin}
					aria-valuemax={rangeMax}
					aria-valuenow={clamped}
					aria-valuetext={`${Math.round(clamped)} dB`}
					className="grid overflow-hidden w-full"
					style={{
						width: "100%",
						aspectRatio: `${COLS}/${ROWS}`,
						padding: PAD,
						gap: GAP,
						gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
						gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
						backgroundColor: GRID_BG,
					}}
				>
					{/* Row-major order so grid row 0 = top strip (all cols), row 1 = middle, row 2 = bottom */}
					{Array.from({ length: ROWS }, (_, row) =>
						Array.from({ length: COLS }, (_unused, col) => {
							const i = row * COLS + col;
							const threshold = (col + 1) * COL_PERCENT;
							const rowPercent =
								displayPercentByRow[row] ?? displayPercentByRow[0];
							const isOn = rowPercent >= threshold;
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
				{/* Labels underneath: Leise under first column, Laut under last column */}
				{isScaleVisible && (
					<div
						className="flex justify-between text-xs text-neutral-700 w-full"
						style={{ paddingLeft: PAD, paddingRight: PAD }}
					>
						<span>{i18n("noiseChart.scale.quiet")}</span>
						<span>{i18n("noiseChart.scale.loud")}</span>
					</div>
				)}
			</div>
		</section>
	);
};

export default NoiseChart;
