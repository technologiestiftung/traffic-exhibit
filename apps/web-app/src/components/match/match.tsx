import React, { useEffect, useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { i18n } from "../../i18n/i18n-utils";
import type { TelraamMatch } from "../../../../api/src/common";
import {
	getDominantTrafficGradientClass,
	getDominantTrafficGradientFromColor,
	getDominantTrafficModalIndex,
	getTrafficModal,
} from "./utils";
import CircleChart from "../charts/circle-chart/circle-chart";
import { MatchCards } from "./match-cards";
import { BerlinMap } from "../map/berlin-map";
import NoiseChart from "../charts/noise-chart";
import { AirQualityGrid } from "../charts/air-quality-grid";
import { MatchDescription } from "./match-description";
import { InfoTooltip } from "../tooltip/info-tooltip";
import { MATCH_INLINE_LABEL_SIZE } from "./match-typography";

const isLargeScreen = window.innerWidth >= 1920;

export const Match: React.FC = () => {
	const {
		goBackToStart,
		telraamMatches = [],
		onSelectionButtonRotated,
		onSelectionButtonPressed,
	} = useWebSocket();
	const [stack, setStack] = useState<TelraamMatch[]>([]);
	const [selectedIndex, setSelectedIndex] = useState<number>(0);
	const [streetViewTrigger, setStreetViewTrigger] = useState(0);

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

	// Handle selection button push (SW): transition tiny planet → street view
	useEffect(() => {
		onSelectionButtonPressed(() => {
			setStreetViewTrigger((prev) => prev + 1);
		});
	}, [onSelectionButtonPressed]);

	const dominantTrafficModalIndex = currentMatch
		? getDominantTrafficModalIndex(currentMatch)
		: null;

	const pageBackgroundClass =
		dominantTrafficModalIndex !== null
			? getDominantTrafficGradientClass(dominantTrafficModalIndex)
			: "bg-gradient-to-b from-bp-gray-light to-bp-white";

	const liveIndicatorDotClass =
		dominantTrafficModalIndex === 2 || dominantTrafficModalIndex === 3
			? "bg-white"
			: "bg-red-500";

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
			className={`flex justify-center h-screen w-full flex-col items-center ${pageBackgroundClass} px-10 pb-20 relative`}
		>
			{/* Transition overlay: starts with loading gradient, fades out to reveal match gradient */}
			<div className="absolute inset-0 bg-gradient-to-b from-[#171719] via-[#3b3b41] to-[#d7d7dd] animate-fade-out pointer-events-none" />

			<div className="mb-2 2xl:mb-4 flex w-full max-w-[1540px] 2xl:max-w-[2000px] xl:px-0 gap-4 2xl:gap-10 flex-row md:justify-between px-10 relative z-10 animate-fade-in mt-16 2xl:mt-24">
				<div className="flex flex-col gap-3 flex-1 pl-5">
					<h1 className="text-left text-5xl 2xl:text-6xl font-semibold text-[#1e2402] drop-shadow uppercase">
						{i18n("match.title")}
					</h1>
				</div>

				{/* Live indicator — top right */}
				<div className="w-[23%] flex flex-col items-start gap-1">
					<div className="flex items-start gap-4">
						<p className="text-xl 2xl:text-2xl font-semibold text-[#1e2402] drop-shadow">
							{i18n("match.subtitle.main")}
						</p>

						<div className="flex shrink-0 items-center gap-3 border border-black px-4 py-2">
							<span className="relative flex h-4 w-4">
								<span
									className={`animate-ping absolute inline-flex size-4 rounded-full opacity-75 ${liveIndicatorDotClass}`}
								/>
								<span
									className={`relative inline-flex rounded-full h-4 w-4 ${liveIndicatorDotClass}`}
								/>
							</span>
							<span className="text-base 2xl:text-lg font-semibold tracking-[0.18em] 2xl:tracking-[0.25em] text-[#1e2402] uppercase">
								Live
							</span>
						</div>
					</div>
					<p
						className={`${MATCH_INLINE_LABEL_SIZE} font-light tracking-normal text-[#1e2402] drop-shadow text-left whitespace-nowrap`}
					>
						{i18n("match.subtitle")}
						<span className="underline underline-offset-2 decoration-black decoration-2">
							{i18n("match.subtitle.highlight")}
						</span>
						{i18n("match.subtitle.end")}
						<InfoTooltip
							type="livedata"
							content={i18n("match.livedata.tooltip")}
						>
							<img
								src="/icon/info-icon.svg"
								alt="Info"
								className="w-4 h-4 cursor-help"
							/>
						</InfoTooltip>
					</p>
				</div>
			</div>

			<div className="relative flex w-full max-w-[1540px] 2xl:max-w-[2000px] justify-between gap-12 z-10 animate-fade-in-delay-200">
				{/* Stacked cards*/}
				<div className="relative flex z-50 overflow-visible ml-44 mt-10 2xl:mt-0">
					<MatchCards
						matchStack={matchStack}
						selectedIndex={selectedIndex}
						handleSelect={handleSelect}
						streetViewTrigger={streetViewTrigger}
					/>
				</div>
				{currentMatch && (
					<div className="translate-x-3/12 mt-4 2xl:mt-0">
						<CircleChart
							key={currentMatch.segment_id}
							data={getTrafficModal(currentMatch)}
						/>
					</div>
				)}
				{currentMatch && (
					<div className="flex flex-col gap-5 2xl:gap-10 w-[23%] h-full items-center justify-between border border-black p-4">
						<BerlinMap
							lat={currentMatch.coordinates[0][1]}
							lon={currentMatch.coordinates[0][0]}
							width={isLargeScreen ? 330 : 260}
							height={isLargeScreen ? 260 : 200}
							districtStrokeColor={getDominantTrafficGradientFromColor(
								getDominantTrafficModalIndex(currentMatch),
							)}
							liveIndicatorDotClass={liveIndicatorDotClass}
						/>

						<MatchDescription
							data={getTrafficModal(currentMatch)}
							coordinates={currentMatch.coordinates}
						/>
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
			{import.meta.env.VITE_IS_DEVELOPMENT === "true" && (
				<button
					className="absolute bottom-10 left-1/2 -translate-x-1/2 border border-gray-600 bg-white/70 px-4 py-2 text-sm font-semibold tracking-wide text-slate-700 transition hover:-translate-y-0.5 hover:bg-white md:self-center z-10 animate-fade-in-delay-200"
					onClick={goBackToStart}
				>
					{i18n("match.createNewMixButton.label")}
				</button>
			)}
		</div>
	);
};
