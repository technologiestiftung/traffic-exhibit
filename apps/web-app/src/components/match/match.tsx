import React, { useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { i18n } from "../../i18n/i18n-utils";
import { MatchCard } from "./match-card";
import type { TelraamMatch } from "../../../../api/src/common";
import { getTrafficModal, scaleForStackPosition } from "./utils";
import CircleChart from "../charts/circle-chart";

const CARD_W = 700;
const CARD_H = 700;
const OFFSET_Y = 0; // keep Y offset only
const MIN_SCALE = 0.9; // smallest card (back of stack)
const STACK_CARD_BG: string[] = [
	"bg-platte-yellow-800", // Last Card
	"bg-platte-yellow-600", // Middle Card
	"bg-gradient-to-b from-platte-yellow-400 to-white", // First Card
];

export const Match: React.FC = () => {
	const { goBackToStart, telraamMatches = [] } = useWebSocket();
	const [stack, setStack] = useState<TelraamMatch[]>([]);

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
	};

	return (
		<div className="relative flex min-h-screen w-full flex-col items-center bg-gradient-to-b from-[#dff97a] via-[#f8ffc7] to-[#fff8c6] px-4 py-10">
			<div className="mb-10 flex w-full max-w-[1540px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="text-left text-4xl font-semibold tracking-[0.25em] text-[#1e2402] drop-shadow">
					Dein Verkehrs-Mix passt zu.
				</div>
				<button
					className="self-start rounded-full border border-black/20 bg-white/70 px-4 py-2 text-sm font-semibold tracking-wide text-slate-700 transition hover:-translate-y-0.5 hover:bg-white md:self-center"
					onClick={goBackToStart}
				>
					{i18n("match.createNewMixButton.label")}
				</button>
			</div>

			<div className="relative flex w-full max-w-[1540px] flex-1 items-center gap-6">
				{/* Stacked cards: no X offset, keep Y offset */}
				<div
					className="relative z-50 w-full overflow-visible"
					style={{
						width: CARD_W + 240,
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
						const rotationAngle = selectedCard ? 0 : 95;
						const depthTranslation = selectedCard
							? 0
							: -reverseIndex * 140 - 80;
						const scale = selectedCard
							? 1.02
							: scaleForStackPosition(reverseIndex, stackLength, MIN_SCALE);
						const transformStyle = `translateZ(${depthTranslation}px) rotateY(${-rotationAngle}deg) scale(${scale})`;
						const leftOffset = selectedCard ? 0 : CARD_W + 40;
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
								transformStyle={transformStyle}
								transformOrigin={selectedCard ? "center" : "left center"}
								leftOffset={leftOffset}
							/>
						);
					})}
				</div>

				{/* Front card by default; updates with selection/reorder */}
				{currentMatch && (
					<CircleChart
						key={currentMatch.segment_id}
						data={getTrafficModal(currentMatch)}
						size={700}
					/>
				)}
			</div>
		</div>
	);
};
