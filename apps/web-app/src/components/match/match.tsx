import React, { useEffect, useRef, useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { i18n } from "../../i18n/i18n-utils";
import { TrafficModalSplit } from "./traffic-modal-split/traffic-modal-split";
import { MatchCard } from "./match-card";
import type { TelraamMatch } from "../../../../api/src/common";
import { scaleForStackPosition } from "./utils";

const CARD_W = 600;
const CARD_H = 600;
const OFFSET_Y = 32; // keep Y offset only
const MIN_SCALE = 0.9; // smallest card (back of stack)
const STACK_CARD_BG: string[] = [
	"bg-gray-300", // Last Card
	"bg-gray-200", // Middle Card
	"bg-gray-100", // First Card
];

// Keep these in sync with animation defaults in index.css and TrafficModalSplit
const DISC_MOVE_DURATION_MS = 1200; // var(--move-duration)
const DISC_FORWARD_DELAY_MS = 1000; // var(--move-delay) for forwards
const DISC_BACKWARD_DELAY_MS = 0; // interactive backward should start immediately
const TOTAL_BACKWARD_TIME = DISC_MOVE_DURATION_MS + DISC_BACKWARD_DELAY_MS;

export const Match: React.FC = () => {
	const { goBackToStart, telraamMatches = [] } = useWebSocket();
	const [stack, setStack] = useState<TelraamMatch[]>([]);
	// Animation direction for the modal disc
	const [isAnimationBackwards, setIsAnimationBackwards] = useState(false);
	// Pending reorder target after backwards animation completes
	const pendingReorder = useRef<TelraamMatch[] | null>(null);
	const activeTimer = useRef<number | null>(null);

	// Clear timers on unmount
	useEffect(() => {
		return () => {
			if (activeTimer.current) {
				clearTimeout(activeTimer.current);
			}
		};
	}, []);

	const displayStack = stack.length ? stack : telraamMatches;
	const currentMatch = displayStack[displayStack.length - 1] ?? null;

	const isSelected = (match: TelraamMatch) =>
		currentMatch?.segment_id
			? match.segment_id === currentMatch.segment_id
			: match === currentMatch;

	// Reorder so clicked → front, previous front → very back; animate backwards first.
	const handleSelect = (clickedIndex: number) => {
		if (!displayStack.length) {
			return;
		}
		const last = displayStack.length - 1;

		// Already front: just lock in stack if not yet stabilized
		if (clickedIndex === last) {
			if (!stack.length) {
				setStack(displayStack.slice());
			}
			return;
		}

		const prevFront = displayStack[last];
		const clicked = displayStack[clickedIndex];
		const others = displayStack.filter(
			(_, idx) => idx !== clickedIndex && idx !== last,
		);
		const newStack = [prevFront, ...others, clicked];

		// If already in backwards phase, update pending reorder and let current timer finish
		if (isAnimationBackwards) {
			pendingReorder.current = newStack;
			return;
		}

		pendingReorder.current = newStack;
		setIsAnimationBackwards(true);

		// Clear any existing timer to avoid multiple reorders
		if (activeTimer.current) {
			clearTimeout(activeTimer.current);
		}
		activeTimer.current = window.setTimeout(() => {
			if (pendingReorder.current) {
				setStack(pendingReorder.current);
				pendingReorder.current = null;
			}
			setIsAnimationBackwards(false); // triggers forward animation for the new front
			activeTimer.current = null;
		}, TOTAL_BACKWARD_TIME);
	};

	return (
		<>
			<div className="flex flex-col justify-center p-3 w-full h-full space-y-7">
				<div className="flex justify-between items-center w-full">
					<h1 className="text-4xl font-bold">{i18n("match.title")}</h1>
					<button
						className="cursor-pointer rounded-sm p-2 hover:bg-gray-200 bg-gray-300"
						onClick={goBackToStart}
					>
						{i18n("match.createNewMixButton.label")}
					</button>
				</div>

				<div className="relative flex items-start gap-6 w-full h-full">
					{/* Stacked cards: no X offset, keep Y offset */}
					<div
						className="relative z-10 w-full"
						style={{
							width: CARD_W,
							height: CARD_H + Math.max(0, displayStack.length - 1) * OFFSET_Y,
						}}
					>
						{displayStack.map((match, index) => {
							const stackLength = displayStack.length;
							const selectedCard = isSelected(match);
							const scale = selectedCard
								? 1
								: scaleForStackPosition(index, stackLength, MIN_SCALE);
							const zIndex = index + 1;
							return (
								<MatchCard
									key={match.segment_id ?? index}
									match={match}
									index={index}
									topOffset={index * OFFSET_Y}
									width={CARD_W}
									height={CARD_H}
									zIndex={zIndex}
									scale={scale}
									backgroundClass={STACK_CARD_BG[index % STACK_CARD_BG.length]}
									selected={selectedCard}
									onSelect={handleSelect}
								/>
							);
						})}
					</div>

					{/* Front card by default; updates with selection/reorder */}
					{currentMatch && (
						<TrafficModalSplit
							key={`${currentMatch.segment_id ?? "front"}-${isAnimationBackwards ? "b" : "f"}`}
							telraamMatch={currentMatch}
							size={600}
							isLegendVisible={false}
							isAnimationBackwards={isAnimationBackwards}
							animationDurationMs={DISC_MOVE_DURATION_MS}
							animationDelayMs={
								isAnimationBackwards
									? DISC_BACKWARD_DELAY_MS
									: DISC_FORWARD_DELAY_MS
							}
						/>
					)}
				</div>
			</div>
		</>
	);
};
