import React, { useState } from "react";
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
	"bg-platte-gray-300", // Last Card
	"bg-platte-gray-200", // Middle Card
	"bg-platte-gray-100", // First Card
];

export const Match: React.FC = () => {
	const { goBackToStart, telraamMatches = [] } = useWebSocket();
	const [stack, setStack] = useState<TelraamMatch[]>([]);
	const [hasModalChanged, setHasModalChanged] = useState(false);

	const displayStack = (stack.length ? stack : telraamMatches).filter(
		(match) => match !== null,
	);
	const currentMatch = displayStack[0] ?? null;

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
		setHasModalChanged(true);
	};

	return (
		<div className="flex flex-col justify-center p-3 w-full h-full space-y-7 lg:max-w-[1540px] mx-auto">
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
					className="relative z-50 w-full"
					style={{
						width: CARD_W,
						height: CARD_H + Math.max(0, displayStack.length - 1) * OFFSET_Y,
					}}
				>
					{displayStack.map((match, index) => {
						const stackLength = displayStack.length;
						const selectedCard = isSelected(match);
						const reverseIndex = stackLength - 1 - index; // reverseIndex: 0 = back, max (stackLength -1) = front
						// Scale by distance from back: reverseIndex 0 = smallest (back), reverseIndex max (stackLength - 1) = largest (front)
						const scale = selectedCard
							? 1
							: scaleForStackPosition(reverseIndex, stackLength, MIN_SCALE);
						const zIndex = stackLength - index; // index 0 => highest
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
								backgroundClass={
									STACK_CARD_BG[reverseIndex % STACK_CARD_BG.length]
								}
								selected={selectedCard}
								onSelect={handleSelect}
							/>
						);
					})}
				</div>

				{/* Front card by default; updates with selection/reorder */}
				{currentMatch && (
					<TrafficModalSplit
						key={`${currentMatch.segment_id}`}
						telraamMatch={currentMatch}
						size={600}
						isLegendVisible={false}
						hasModalChanged={hasModalChanged}
					/>
				)}
			</div>
		</div>
	);
};
