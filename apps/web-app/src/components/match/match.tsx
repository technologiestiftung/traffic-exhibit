import React, { useEffect, useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { i18n } from "../../i18n/i18n-utils";
import { MatchCard, type StackPositionStyles } from "./match-card";
import type { TelraamMatch } from "../../../../api/src/common";
import {
	getDominantTrafficGradientClass,
	getDominantTrafficModalIndex,
	getTrafficModal,
	scaleForStackPosition,
} from "./utils";
import CircleChart from "../charts/circle-chart/circle-chart";
import { MatchDescription } from "./match-description";

const CARD_W = 620;
const CARD_H = 620;
const OFFSET_Y = 0;
const MIN_SCALE = 0.9;

export const Match: React.FC = () => {
	const {
		goBackToStart,
		telraamMatches = [],
		onRotaryEncoder2Rotated,
	} = useWebSocket();
	const [stack, setStack] = useState<TelraamMatch[]>([]);

	// Initialize stack when telraamMatches first loads
	useEffect(() => {
		if (telraamMatches.length > 0 && stack.length === 0) {
			setStack(telraamMatches.filter((match) => match !== null));
		}
	}, [telraamMatches, stack.length]);

	const matchStack =
		stack.length > 0 ? stack : telraamMatches.filter((match) => match !== null);
	const currentMatch = matchStack[0] ?? null;

	// Handle rotary encoder 2 rotation to navigate between matches
	useEffect(() => {
		onRotaryEncoder2Rotated((data) => {
			// eslint-disable-next-line no-console
			console.log("Rotary encoder 2 in match.tsx:", data);

			setStack((currentStack) => {
				const activeStack =
					currentStack.length > 0
						? currentStack
						: telraamMatches.filter((match) => match !== null);

				if (activeStack.length <= 1) {
					return currentStack;
				}

				if (data.direction === "clockwise") {
					return [...activeStack.slice(1), activeStack[0]];
				} else if (data.direction === "counter-clockwise") {
					return [
						activeStack[activeStack.length - 1],
						...activeStack.slice(0, -1),
					];
				}

				return currentStack;
			});
		});
	}, [onRotaryEncoder2Rotated, telraamMatches]);
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
		if (!matchStack.length) {
			return;
		}

		if (clickedIndex === 0) {
			if (!stack.length) {
				setStack(matchStack.slice());
			}
			return;
		}

		const prevFront = matchStack[0];
		const clicked = matchStack[clickedIndex];
		const others = matchStack.filter(
			(_, idx) => idx !== clickedIndex && idx !== 0,
		);
		const newStack = [clicked, ...others, prevFront];
		setStack(newStack);
	};

	return (
		<div
			className={`relative flex min-h-screen w-full flex-col items-center ${pageBackgroundClass} px-4 py-10`}
		>
			<div className="mb-10 flex w-full max-w-[1540px] flex-col gap-4 px-6 md:flex-row md:items-center md:justify-between lg:px-10">
				<div className="font-pixel text-left text-4xl font-semibold tracking-[0.25em] text-[#1e2402] drop-shadow font-title">
					{i18n("match.title")}
				</div>
				<button
					className="self-start border border-gray-600 bg-white/70 px-4 py-2 text-sm font-semibold tracking-wide text-slate-700 transition hover:-translate-y-0.5 hover:bg-white md:self-center"
					onClick={goBackToStart}
				>
					{i18n("match.createNewMixButton.label")}
				</button>
			</div>

			<div className="relative flex w-full max-w-[1540px] flex-1 items-center gap-6 px-12">
				{/* Stacked cards*/}
				<div
					className="relative z-50 overflow-visible"
					style={{
						width: CARD_W + 220,
						height: CARD_H + Math.max(0, matchStack.length - 1) * OFFSET_Y,
						perspective: "2200px",
						transformStyle: "preserve-3d",
						marginLeft: 32 * (matchStack.length - 1),
					}}
				>
					{matchStack.map((match, index) => {
						const stackLength = matchStack.length;
						const selectedCard = isSelected(match);
						const reverseIndex = stackLength - 1 - index;
						const zIndex = stackLength - index;
						const scale = selectedCard
							? 1.02
							: scaleForStackPosition(reverseIndex, stackLength, MIN_SCALE);
						const transformStyle = `scale(${scale})`;
						// Progressive left offset: cards further from front are shifted more to the left
						const leftOffset = selectedCard ? 0 : -50 * index;

						const stackPosition: StackPositionStyles = {
							topOffset: reverseIndex * OFFSET_Y,
							zIndex,
							scale,
							transformStyle,
							transformOrigin: "center",
							leftOffset,
						};

						return (
							<MatchCard
								key={match.segment_id ?? index}
								match={match}
								index={index}
								stackPosition={stackPosition}
								selected={selectedCard}
								onSelect={handleSelect}
							/>
						);
					})}
				</div>

				{/* Front card by default; updates with selection/reorder */}
				{currentMatch && (
					<>
						<div className="absolute translate-x-4/5">
							<CircleChart
								key={currentMatch.segment_id}
								data={getTrafficModal(currentMatch)}
								size={620}
							/>
						</div>

						<MatchDescription
							data={getTrafficModal(currentMatch)}
							coordinates={currentMatch.coordinates}
						/>
					</>
				)}
			</div>
		</div>
	);
};
