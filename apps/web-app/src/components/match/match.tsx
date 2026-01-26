import React, { useState, useEffect, useRef } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { i18n } from "../../i18n/i18n-utils";
import { MatchCard } from "./match-card";
import type { TelraamMatch } from "../../../../api/src/common";
import {
	getDominantTrafficGradientClass,
	getDominantTrafficModalIndex,
	getTrafficModal,
	scaleForStackPosition,
} from "./utils";
import CircleChart from "../charts/circle-chart/circle-chart";

const CARD_W = 620;
const CARD_H = 620;
const OFFSET_Y = 0; // keep Y offset only
const MIN_SCALE = 0.9; // smallest card (back of stack)
const ROW_SHIFT_X = 90; // move cards + chart together to the left
const CHART_SHIFT_X = -180; // additional left shift for the circle chart

export const Match: React.FC = () => {
	const { goBackToStart, telraamMatches = [], onRotaryEncoder2Rotated } =
		useWebSocket();
	const [stack, setStack] = useState<TelraamMatch[]>([]);
	const stackRef = useRef(stack);
	const telraamMatchesRef = useRef(telraamMatches);

	// Keep refs in sync with state
	useEffect(() => {
		stackRef.current = stack;
	}, [stack]);

	useEffect(() => {
		telraamMatchesRef.current = telraamMatches;
	}, [telraamMatches]);

	const displayStack = (stack.length ? stack : telraamMatches).filter(
		(match) => match !== null,
	);
	const currentMatch = displayStack[0] ?? null;
	const pageBackgroundClass = currentMatch
		? getDominantTrafficGradientClass(
				getDominantTrafficModalIndex(currentMatch),
			)
		: "bg-gradient-to-b from-bp-yellow via-bp-green to-bp-pink";

	const isSelected = (match: TelraamMatch) =>
		currentMatch?.segment_id
			? match.segment_id === currentMatch.segment_id
			: match === currentMatch;

	// Reorder so clicked index becomes NEW FRONT (index 0), previous front moves to very back.
	const handleSelect = (clickedIndex: number) => {
		if (!displayStack.length) {
			return;
		}

		if (clickedIndex === 0) {
			if (!stack.length) {
				// Stabilize live list into a managed stack so repeated clicks don't reshuffle when feed updates
				setStack(displayStack.slice());
			}
			return;
		}

		const prevFront = displayStack[0];
		const clicked = displayStack[clickedIndex];
		const others = displayStack.filter(
			(_, idx) => idx !== clickedIndex && idx !== 0,
		);
		const newStack = [clicked, ...others, prevFront];
		setStack(newStack);
	};

	// Handle rotary encoder 2 rotation to switch between cards
	useEffect(() => {
		onRotaryEncoder2Rotated((data) => {
			// Get current state from refs
			const currentStack = stackRef.current;
			const currentTelraamMatches = telraamMatchesRef.current;
			const currentDisplayStack = (
				currentStack.length ? currentStack : currentTelraamMatches
			).filter((match) => match !== null);

			if (!currentDisplayStack.length) {
				return;
			}

			// Stabilize stack if not already stabilized
			if (!currentStack.length) {
				setStack(currentDisplayStack.slice());
				return;
			}

			// Clockwise = next card (move to previous in stack, which is index 1)
			// Counter-clockwise = previous card (move to last in stack)
			if (data.direction === "clockwise") {
				// Move to next card: take card at index 1 and move it to front
				if (currentDisplayStack.length > 1) {
					const currentFront = currentDisplayStack[0];
					const nextCard = currentDisplayStack[1];
					const others = currentDisplayStack.slice(2);
					const newStack = [nextCard, ...others, currentFront];
					setStack(newStack);
				}
			} else if (data.direction === "counter-clockwise") {
				// Move to previous card: take last card and move it to front
				if (currentDisplayStack.length > 1) {
					const currentFront = currentDisplayStack[0];
					const others = currentDisplayStack.slice(1, -1);
					const previousCard =
						currentDisplayStack[currentDisplayStack.length - 1];
					const newStack = [previousCard, currentFront, ...others];
					setStack(newStack);
				}
			}
		});
	}, [onRotaryEncoder2Rotated]);

	return (
		<div
			className={`relative flex min-h-screen w-full flex-col items-center ${pageBackgroundClass} px-4 py-10`}
		>
			<div className="mb-10 flex w-full max-w-[1540px] flex-col gap-4 px-6 md:flex-row md:items-center md:justify-between lg:px-10">
				<div className="text-left text-4xl font-semibold tracking-[0.25em] text-[#1e2402] drop-shadow font-title">
					{i18n("match.title")}
				</div>
				<button
					className="self-start rounded-full border border-black/20 bg-white/70 px-4 py-2 text-sm font-semibold tracking-wide text-slate-700 transition hover:-translate-y-0.5 hover:bg-white md:self-center"
					onClick={goBackToStart}
				>
					{i18n("match.createNewMixButton.label")}
				</button>
			</div>

			<div
				className="relative flex w-full max-w-[1540px] flex-1 items-center gap-6"
				style={{ transform: `translateX(${ROW_SHIFT_X}px)` }}
			>
				{/* Stacked cards: no X offset, keep Y offset */}
				<div
					className="relative z-50 w-full overflow-visible"
					style={{
						width: CARD_W + 220,
						height: CARD_H + Math.max(0, displayStack.length - 1) * OFFSET_Y,
						perspective: "2200px",
						transformStyle: "preserve-3d",
					}}
				>
					{displayStack.map((match, index) => {
						const stackLength = displayStack.length;
						const selectedCard = isSelected(match);
						const reverseIndex = stackLength - 1 - index; // reverseIndex: 0 = back, max (stackLength -1) = front
						const zIndex = stackLength - index; // index 0 => highest
						const rotationAngle = selectedCard ? 0 : 90;
						const depthTranslation = selectedCard
							? 0
							: -reverseIndex * 140 - 80;
						const scale = selectedCard
							? 1.02
							: scaleForStackPosition(reverseIndex, stackLength, MIN_SCALE);
						const transformStyle = `translateZ(${depthTranslation}px) rotateY(${-rotationAngle}deg) scale(${scale})`;
						const leftOffset = selectedCard ? 0 : CARD_W + 32;
						const dominantIndex = getDominantTrafficModalIndex(match);
						const backgroundClass =
							getDominantTrafficGradientClass(dominantIndex);
						return (
							<MatchCard
								key={match.segment_id ?? index}
								match={match}
								index={index}
								topOffset={reverseIndex * OFFSET_Y}
								width={CARD_W}
								height={CARD_H}
								zIndex={zIndex}
								scale={scale}
								backgroundClass={backgroundClass}
								selected={selectedCard}
								onSelect={handleSelect}
								transformStyle={transformStyle}
								transformOrigin={selectedCard ? "center" : "left center"}
								leftOffset={leftOffset}
							/>
						);
					})}
				</div>

				{/* Front card by default; updates with selection/reorder */}
				{currentMatch && (
					<div
						style={{ transform: `translateX(${CHART_SHIFT_X}px)` }}
						className="-ml-16"
					>
						<CircleChart
							key={currentMatch.segment_id}
							data={getTrafficModal(currentMatch)}
							size={620}
						/>
					</div>
				)}
			</div>
		</div>
	);
};
