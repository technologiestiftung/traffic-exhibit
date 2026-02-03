import React, { useEffect, useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { i18n } from "../../i18n/i18n-utils";
import type { TelraamMatch } from "../../../../api/src/common";
import {
	getDominantTrafficGradientClass,
	getDominantTrafficModalIndex,
	getTrafficModal,
} from "./utils";
import CircleChart from "../charts/circle-chart/circle-chart";
import { MatchDescription } from "./match-description";
import { MatchCards } from "./match-cards";

export const Match: React.FC = () => {
	const {
		goBackToStart,
		telraamMatches = [],
		onSelectionButtonRotated,
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

	// Handle selection button rotation to navigate between matches
	useEffect(() => {
		onSelectionButtonRotated((data) => {
			// eslint-disable-next-line no-console
			console.log("Selection button in match.tsx:", data);

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
	}, [onSelectionButtonRotated, telraamMatches]);
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
			<div className="mb-10 flex w-full max-w-[1540px] xl:max-w-[1820px] xl:px-0 flex-col gap-4 px-6 md:flex-row md:items-center md:justify-between lg:px-10">
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

			<div className="relative flex w-full max-w-[1540px] 2xl:max-w-[1820px] flex-1 items-center gap-6 px-12">
				{/* Stacked cards*/}
				<div className="relative flex items-center z-50 h-[600px] 2xl:h-[850px] overflow-visible ml-20">
					<MatchCards
						matchStack={matchStack}
						selectedIndex={selectedIndex}
						handleSelect={handleSelect}
					/>
				</div>

				{/* Front card by default; updates with selection/reorder */}
				{currentMatch && (
					<>
						<div className="absolute translate-x-4/5">
							<CircleChart
								key={currentMatch.segment_id}
								data={getTrafficModal(currentMatch)}
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
