import React from "react";
import { BerlinMap } from "../map/berlin-map";
import { Pill } from "../pill/pill";
import { NoiseChart } from "../charts/noise-chart";
import { AirQualityChart } from "../charts/air-quality-chart";
import { TrafficStats } from "./traffic-stats/traffic-stats";
import type { TelraamMatch } from "../../../../api/src/common";
import { i18n } from "../../i18n/i18n-utils";

export type MatchCardProps = {
	match: TelraamMatch;
	index: number;
	topOffset: number; // computed top
	width: number;
	height: number;
	zIndex: number;
	scale: number;
	backgroundClass: string;
	selected: boolean;
	onSelect: (index: number) => void;
};

export const MatchCard: React.FC<MatchCardProps> = ({
	match,
	index,
	topOffset,
	width,
	height,
	zIndex,
	scale,
	backgroundClass,
	selected,
	onSelect,
}) => {
	return (
		<button
			type="button"
			onClick={() => onSelect(index)}
			aria-pressed={selected}
			className={`absolute rounded-sm cursor-pointer ${backgroundClass} ${selected ? "shadow-2xl" : "shadow-xl hover:-translate-y-0.5"}`}
			style={{
				top: topOffset,
				width,
				height,
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
								backgroundColor="bg-platte-green-400"
								textColor="text-gray-600"
							/>
						))}
					</div>
					<p className="text-xl py-2 text-start">{match.district ?? ""}</p>
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
						className="w-full h-full object-cover rounded-sm"
					/>
				)}
				{match.originalProperties && <TrafficStats telraamMatch={match} />}
			</div>
			{match.nearestNoiseLevel !== null && (
				<NoiseChart
					title={i18n("noiseChart.title")}
					value={match.nearestNoiseLevel}
					markerSize={8}
				/>
			)}
			<AirQualityChart
				title={i18n("airQualityChart.title")}
				value={match.airQuality}
				markerSize={8}
			/>
		</button>
	);
};
