import React from "react";
import { Pill } from "../pill/pill";
import { NoiseChart } from "../charts/noise-chart";
import { AirQualityChart } from "../charts/air-quality-chart";
import type { TelraamMatch } from "../../../../api/src/common";
import { i18n } from "../../i18n/i18n-utils";
import { MatchTinyWorldImg } from "./match-tiny-world-img";
import {
	getImageUrl,
	getDominantTrafficModalIndex,
	getDominantTrafficGradientClass,
} from "./utils";

const CARD_W = 620;
const CARD_H = 620;

export type StackPositionStyles = {
	topOffset: number;
	zIndex: number;
	scale: number;
	transformStyle: string;
	transformOrigin: string;
	leftOffset: number;
};

export type MatchCardProps = {
	match: TelraamMatch;
	index: number;
	stackPosition: StackPositionStyles;
	selected: boolean;
	onSelect: (index: number) => void;
};

export const MatchCard: React.FC<MatchCardProps> = ({
	match,
	index,
	stackPosition,
	selected,
	onSelect,
}) => {
	const imageSrc = match.imageURL ? getImageUrl(match.imageURL) : null;
	const dominantIndex = getDominantTrafficModalIndex(match);
	const backgroundClass = getDominantTrafficGradientClass(dominantIndex);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onSelect(index);
		}
	};

	return (
		<div
			role="button"
			tabIndex={0}
			onClick={() => onSelect(index)}
			onKeyDown={handleKeyDown}
			aria-pressed={selected}
			className={`absolute border border-gray-900 cursor-pointer transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${backgroundClass} ${selected ? "shadow-2xl" : "shadow-xl"}`}
			style={{
				top: stackPosition.topOffset,
				left: stackPosition.leftOffset,
				width: CARD_W,
				height: CARD_H,
				zIndex: stackPosition.zIndex,
				transform:
					stackPosition.transformStyle || `scale(${stackPosition.scale})`,
				transformOrigin: stackPosition.transformOrigin,
			}}
		>
			<div className="flex flex-col justify-between h-full">
				{/* HEADER */}
				<div className="flex justify-between items-center p-2.5 w-full">
					<div>
						<div className="flex gap-5 items-center max-w-md">
							<h2 className="text-4xl font-pixel truncate">
								{match.address?.split(",")[0] ?? ""}
							</h2>
							{match.bikeLaneTypes?.map((type) => (
								<Pill
									key={type}
									value={type}
									className="bg-black text-bp-green"
								/>
							))}
						</div>
						<p className="text-base py-1.5 text-start">
							{match.district ?? ""}
						</p>
					</div>
				</div>

				{/* IMAGE */}
				<div className="h-[340px] relative">
					{imageSrc && (
						<MatchTinyWorldImg imageUrl={imageSrc} shouldAnimate={selected} />
					)}
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
		</div>
	);
};
