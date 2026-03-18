import React, { useEffect, useState } from "react";
import { InfoTooltip } from "../tooltip/info-tooltip";
import { i18n } from "../../i18n/i18n-utils";

interface AirQualityGridProps {
	airQuality: number; // 1-5
}

export const AirQualityGrid: React.FC<AirQualityGridProps> = ({
	airQuality,
}) => {
	const TOTAL_CELLS = 400;
	const rows = 8;
	const cols = 50;

	// Map air quality level to translation key
	const getAirQualityLabel = (level: number): string => {
		const labels: Record<number, string> = {
			1: i18n("airQualityChart.step.veryLow"),
			2: i18n("airQualityChart.step.low"),
			3: i18n("airQualityChart.step.moderate"),
			4: i18n("airQualityChart.step.elevated"),
			5: i18n("airQualityChart.step.high"),
		};
		return labels[level] || labels[3];
	};

	// Calculate number of black cells based on air quality level
	const getBlackCellCount = (level: number): number => {
		const percentages = {
			1: 0.05, // 0-20% → use 10% (5 cells)
			2: 0.2, // 20-40% → use 30% (15 cells)
			3: 0.4, // 40-60% → use 50% (25 cells)
			4: 0.6, // 60-80% → use 70% (35 cells)
			5: 0.8, // 80-100% → use 90% (45 cells)
		};
		return Math.floor(
			TOTAL_CELLS * (percentages[level as keyof typeof percentages] || 0.5),
		);
	};

	const blackCellCount = getBlackCellCount(airQuality);

	// Generate random positions for black cells
	const generateBlackPositions = (): Set<number> => {
		const positions = new Set<number>();
		while (positions.size < blackCellCount) {
			positions.add(Math.floor(Math.random() * TOTAL_CELLS));
		}
		return positions;
	};

	const [blackPositions, setBlackPositions] = useState<Set<number>>(
		generateBlackPositions(),
	);

	// Animate positions every 2 seconds
	useEffect(() => {
		const interval = setInterval(() => {
			setBlackPositions(generateBlackPositions());
		}, 500);

		return () => clearInterval(interval);
	}, [blackCellCount]);

	return (
		<div className="w-full h-fit flex flex-col gap-2">
			<div className="flex items-center gap-2 self-start">
				<h3 className="text-base 2xl:text-lg font-semibold text-black">
					{i18n("airQualityChart.title")}
					{getAirQualityLabel(airQuality)}
				</h3>
				<InfoTooltip
					type="airQualityChart"
					content={i18n("airQualityChart.description")}
				>
					<img
						src="/info-icon.svg"
						alt="Info"
						className="w-5 h-5 cursor-help"
					/>
				</InfoTooltip>
			</div>
			<div className="flex-1 w-full min-h-0 flex items-center justify-center">
				<div
					className="flex flex-wrap gap-[1px] w-full"
					style={{
						aspectRatio: `${cols} / ${rows}`,
						maxHeight: "100%",
					}}
				>
					{Array.from({ length: TOTAL_CELLS }).map((_, index) => (
						<div
							key={index}
							className={`transition-all duration-2000 ease-in-out rounded-xs ${
								blackPositions.has(index) ? "bg-black" : "bg-transparent"
							}`}
							style={{
								width: `calc((100% - ${cols - 1}px) / ${cols})`,
								aspectRatio: "1",
							}}
						/>
					))}
				</div>
			</div>
			<p className="text-base 2xl:text-lg font-light text-black"></p>
		</div>
	);
};
