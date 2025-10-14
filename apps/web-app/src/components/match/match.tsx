import React, { useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { BerlinMap } from "../map/berlin-map";
import { NoiseChart } from "../charts/noise-chart";
import { Pill } from "../pill/pill";
import { AirQualityChart } from "../charts/air-quality-chart";
import { TrafficStats } from "./traffic-stats/traffic-stats";
import { i18n } from "../../i18n/i18n-utils";
import { TrafficModalSplit } from "./traffic-modal-split/traffic-modal-split";
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

export const Match: React.FC = () => {
	const { goBackToStart, telraamMatches = [] } = useWebSocket();
	const [stack, setStack] = useState<TelraamMatch[]>([]);

	const displayStack = (stack.length ? stack : telraamMatches).filter(
		(match) => match !== null,
	);
	const currentMatch = displayStack[displayStack.length - 1] ?? null;

	const isSelected = (match: TelraamMatch) =>
		currentMatch?.segment_id
			? match.segment_id === currentMatch.segment_id
			: match === currentMatch;

	// Reorder so clicked → front, and previous front → very back; keep others' relative order.
	const handleSelect = (clickedIndex: number) => {
		if (!displayStack.length) {
			return;
		}

		const last = displayStack.length - 1;
		if (clickedIndex === last) {
			// already front; lock in a local stack for stable future reorders
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
		setStack(newStack);
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
							const zIndex = index + 1; // later index (front) is on top
							return (
								<button
									key={match.segment_id ?? index}
									type="button"
									onClick={() => handleSelect(index)}
									aria-pressed={selectedCard}
									className={`absolute rounded-sm cursor-pointer ${STACK_CARD_BG[index % STACK_CARD_BG.length]} ${selectedCard ? "shadow-2xl" : "shadow-xl hover:-translate-y-0.5"}`}
									style={{
										top: index * OFFSET_Y,
										width: CARD_W,
										height: CARD_H,
										zIndex,
										transform: `scale(${scale})`,
										transformOrigin: "top",
									}}
								>
									{/* HEADER */}
									<div className="flex justify-between items-center p-3 w-full">
										<div>
											<div className="flex gap-4 items-center max-w-md">
												<h2 className="text-2xl font-bold max-w-sm truncate">
													{match.address?.split(",")[0] ?? ""}
												</h2>
												{match.bikeLaneTypes?.map((type) => (
													<Pill
														key={type}
														value={type}
														backgroundColor="bg-gray-500"
														textColor="text-gray-100"
													/>
												))}
											</div>
											<p className="text-xl py-2">{match.district ?? ""}</p>
										</div>

										{Array.isArray(match.coordinates) &&
											Array.isArray(match.coordinates[0]) && (
												<BerlinMap
													lat={match.coordinates[0][1]}
													lon={match.coordinates[0][0]}
													width={100}
													height={100}
												/>
											)}
									</div>

									{/* IMAGE */}
									<div className="w-full h-80 relative">
										{match.imageURL && (
											<img
												src={match.imageURL}
												alt={match.address ?? "Street view"}
												className="w-full h-full object-cover"
											/>
										)}
										{match.originalProperties && (
											<TrafficStats telraamMatch={match} />
										)}
									</div>

									<NoiseChart
										title={i18n("noiseChart.title")}
										value={match.nearestNoiseLevel}
										markerSize={8}
									/>
									<AirQualityChart
										title={i18n("airQualityChart.title")}
										value={match.airQuality}
										markerSize={8}
									/>
								</button>
							);
						})}
					</div>

					{/* Front card by default; updates with selection/reorder */}
					{currentMatch && (
						<TrafficModalSplit
							telraamMatch={currentMatch}
							size={600}
							isLegendVisible={false}
						/>
					)}
				</div>
			</div>
		</>
	);
};
