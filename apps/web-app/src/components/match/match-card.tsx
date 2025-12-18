import React from "react";
import { BerlinMap } from "../map/berlin-map";
import { Pill } from "../pill/pill";
import { NoiseChart } from "../charts/noise-chart";
import { AirQualityChart } from "../charts/air-quality-chart";
import { TrafficStats } from "./traffic-stats/traffic-stats";
import type { TelraamMatch } from "../../../../api/src/common";
import { i18n } from "../../i18n/i18n-utils";
import { MatchTinyWorldImg } from "./match-tiny-world-img";

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
	transformStyle: string;
	transformOrigin?: string;
	leftOffset?: number;
};

const getImageUrl = (imageURL: string | null): string | null => {
	if (!imageURL) {
		return null;
	}

	// Extract filename from relative paths
	if (imageURL.includes("../")) {
		const filename = imageURL.split("/").pop();
		return filename ? `/api/data/raw-images/${filename}` : null;
	}

	// Extract relative path from absolute paths
	const matchImage = imageURL.match(/data\/raw-images\/[^/]+$/);
	return matchImage ? `/api/${matchImage[0]}` : null;
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
	transformStyle,
	transformOrigin,
	leftOffset = 0,
}) => {
	const imageSrc = match.imageURL ? getImageUrl(match.imageURL) : null;

	return (
		<button
			type="button"
			onClick={() => onSelect(index)}
			aria-pressed={selected}
			className={`absolute rounded-xl cursor-pointer transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${backgroundClass} ${selected ? "shadow-2xl" : "shadow-xl"}`}
			style={{
				top: topOffset,
				left: leftOffset,
				width,
				height,
				zIndex,
				transform: transformStyle || `scale(${scale})`,
				transformOrigin: transformOrigin ?? "center left",
			}}
		>
			<div className="flex flex-col justify-between h-full">
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
				<div className="w-full h-[400px] relative">
					{imageSrc && (
						<MatchTinyWorldImg
							imageUrl={imageSrc}
							shouldAnimate={selected}
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
			</div>
		</button>
	);
};
