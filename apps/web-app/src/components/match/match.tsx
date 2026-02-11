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
import { MatchCards } from "./match-cards";
import { BerlinMap } from "../map/berlin-map";
import NoiseChart from "../charts/noise-chart";
import { AirQualityGrid } from "../charts/air-quality-grid";

const isLargeScreen = window.innerWidth > 1920;

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
		: "bg-gradient-to-b from-bp-gray-light to-bp-white";

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
			className={`flex justify-center h-screen w-full flex-col items-center ${pageBackgroundClass} px-4 pb-20`}
		>
			<div className="mb-8 2xl:mb-16 flex w-full max-w-[1540px] 2xl:max-w-[2300px] xl:px-0 gap-4 2xl:gap-10 flex-row md:justify-between px-10">
				<h1 className="font-pixel text-left text-4xl 2xl:text-6xl font-semibold text-[#1e2402] drop-shadow font-title">
					{i18n("match.title")}
				</h1>

				<h2 className="text-right w-1/4 text-md 2xl:text-2xl tracking-[0.25em] text-[#1e2402] drop-shadow font-title">
					{i18n("match.subtitle")}
				</h2>
			</div>

			<div className="relative flex w-full max-w-[1540px] 2xl:max-w-[2300px] items-center justify-between gap-12">
				{/* Stacked cards*/}
				<div className="relative flex z-50 h-[600px] 2xl:h-[850px] overflow-visible ml-44">
					<MatchCards
						matchStack={matchStack}
						selectedIndex={selectedIndex}
						handleSelect={handleSelect}
					/>
				</div>
				{currentMatch && (
					<div className="translate-x-3/12">
						<CircleChart
							key={currentMatch.segment_id}
							data={getTrafficModal(currentMatch)}
						/>
					</div>
				)}
				{currentMatch && (
					<div className="flex flex-col gap-5 w-1/4 h-full 2xl:w-1/3  items-center justify-center">
						{currentMatch && (
							<BerlinMap
								lat={currentMatch.coordinates[0][1]}
								lon={currentMatch.coordinates[0][0]}
								width={isLargeScreen ? 320 : 220}
								height={isLargeScreen ? 270 : 170}
							/>
						)}
						{currentMatch.nearestNoiseLevel !== null && (
							<NoiseChart
								title={i18n("noiseChart.title")}
								value={currentMatch.nearestNoiseLevel}
							/>
						)}
						<AirQualityGrid airQuality={currentMatch.airQuality} />
					</div>
				)}
			</div>
			<button
				className="absolute bottom-10 left-1/2 -translate-x-1/2 border border-gray-600 bg-white/70 px-4 py-2 text-sm font-semibold tracking-wide text-slate-700 transition hover:-translate-y-0.5 hover:bg-white md:self-center"
				onClick={goBackToStart}
			>
				{i18n("match.createNewMixButton.label")}
			</button>
		</div>
	);
};
