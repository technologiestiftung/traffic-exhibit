import React, { useEffect, useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { i18n } from "../../i18n/i18n-utils";
import { MatchCard, type StackPositionStyles } from "./match-card";
import type { TelraamMatch } from "../../../../api/src/common";
import {
	getDominantTrafficGradientClass,
	getDominantTrafficModalIndex,
	getTrafficModal,
} from "./utils";
import CircleChart from "../charts/circle-chart/circle-chart";
import { MatchDescription } from "./match-description";

const CARD_W = 620;
const CARD_H = 620;

export const Match: React.FC = () => {
	const {
		goBackToStart,
		telraamMatches = [],
		onRotaryEncoder2Rotated,
	} = useWebSocket();
	const [stack, setStack] = useState<TelraamMatch[]>([]);
	const [selectedIndex, setSelectedIndex] = useState<number>(0);

	// Initialize stack when telraamMatches first loads
	useEffect(() => {
		if (telraamMatches.length > 0 && stack.length === 0) {
			setStack(telraamMatches.filter((match) => match !== null));
			setSelectedIndex(0);
		}
	}, [telraamMatches, stack.length]);

	const matchStack =
		stack.length > 0 ? stack : telraamMatches.filter((match) => match !== null);
	const currentMatch = matchStack[selectedIndex] ?? null;

	// Handle rotary encoder 2 rotation to navigate between matches
	useEffect(() => {
		onRotaryEncoder2Rotated((data) => {
			// eslint-disable-next-line no-console
			console.log("Rotary encoder 2 in match.tsx:", data);

			const activeStack =
				stack.length > 0
					? stack
					: telraamMatches.filter((match) => match !== null);

			if (activeStack.length <= 1) {
				return;
			}

			if (data.direction === "clockwise") {
				setSelectedIndex((prev) => (prev + 1) % activeStack.length);
			} else if (data.direction === "counter-clockwise") {
				setSelectedIndex(
					(prev) => (prev - 1 + activeStack.length) % activeStack.length,
				);
			}
		});
	}, [onRotaryEncoder2Rotated, telraamMatches, stack]);
	const pageBackgroundClass = currentMatch
		? getDominantTrafficGradientClass(
				getDominantTrafficModalIndex(currentMatch),
			)
		: "bg-gradient-to-b from-bp-yellow via-bp-green to-bp-pink";

	const handleSelect = (clickedIndex: number) => {
		if (!matchStack.length) {
			return;
		}

		if (!stack.length) {
			setStack(matchStack.slice());
		}

		setSelectedIndex(clickedIndex);
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
						height: CARD_H,
						perspective: "2200px",
						transformStyle: "preserve-3d",
						marginLeft: 50 * (matchStack.length - 1) + 32,
					}}
				>
					{matchStack.map((match, index) => {
						const stackLength = matchStack.length;
						const isSelectedCard = index === selectedIndex;
						const leftOffset = -50 * index;

						// Custom z-index logic: index 1 always in middle unless selected
						let zIndex: number;
						if (isSelectedCard) {
							zIndex = stackLength + 1; // Selected card always on top
						} else if (index === 1) {
							zIndex = 2; // Middle card always at z-index 2
						} else if (index === 0) {
							zIndex = selectedIndex === 2 ? 1 : 3; // First card: low when third is selected, high otherwise
						} else if (index === 2) {
							zIndex = selectedIndex === 0 ? 1 : 3; // Third card: low when first is selected, high otherwise
						} else {
							zIndex = stackLength - index; // Fallback for more than 3 cards
						}

						const scale = isSelectedCard ? 1.02 : 0.95;
						const transformStyle = `scale(${scale})`;

						const stackPosition: StackPositionStyles = {
							topOffset: 0,
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
								selected={isSelectedCard}
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
