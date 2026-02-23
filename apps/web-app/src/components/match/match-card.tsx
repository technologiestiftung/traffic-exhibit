import React from "react";
import { Pill } from "../pill/pill";
import { InfoTooltip } from "../tooltip/info-tooltip";
import { useInfoTooltipStore } from "../../stores/useInfoTooltipStore";
import type { TelraamMatch } from "../../../../api/src/common";
import { MatchTinyWorldImg } from "./match-tiny-world-img";
import {
	getImageUrl,
	getDominantTrafficModalIndex,
	getDominantTrafficGradientClass,
} from "./utils";
import { i18n } from "../../i18n/i18n-utils";
import type { AvailableTranslations } from "../../i18n/translations";

const BIKE_LANE_TYPE_LABELS: Record<string, AvailableTranslations> = {
	// WFS values from Berlin API
	Ergänzungsnetz: "match.bikeLaneType.secondaryBikeNetwork",
	Fahrradstrasse: "match.bikeLaneType.bikePriorityStreet",
	Radvorrangnetz: "match.bikeLaneType.primaryBikeNetwork",
	Lückenschluss: "match.bikeLaneType.networkConnector",
	Hauptradroutennetz: "match.bikeLaneType.primaryBikeNetwork",
};

const BIKE_LANE_TYPE_DESCRIPTIONS: Record<string, AvailableTranslations> = {
	// WFS values from Berlin API
	Ergänzungsnetz: "match.bikeLaneType.secondaryBikeNetwork.description",
	Fahrradstrasse: "match.bikeLaneType.bikePriorityStreet.description",
	Radvorrangnetz: "match.bikeLaneType.primaryBikeNetwork.description",
	Lückenschluss: "match.bikeLaneType.networkConnector.description",
	Hauptradroutennetz: "match.bikeLaneType.primaryBikeNetwork.description",
};

function getBikeLaneTypeLabel(type: string): string {
	const key = BIKE_LANE_TYPE_LABELS[type];
	return key ? i18n(key) : type;
}

function getBikeLaneTypeDescription(type: string): string {
	const key = BIKE_LANE_TYPE_DESCRIPTIONS[type];
	return key ? i18n(key) : "";
}

const isLargeScreen = window.innerWidth > 1620;

export type StackPositionStyles = {
	zIndex: number;
	scale: number;
	transformStyle: string;
	leftOffset: number;
};

export type MatchCardProps = {
	match: TelraamMatch;
	index: number;
	stackPosition: StackPositionStyles;
	selected: boolean;
	onSelect: (index: number) => void;
	transitionToStreetViewTrigger?: number;
};

export const MatchCard: React.FC<MatchCardProps> = ({
	match,
	index,
	stackPosition,
	selected,
	onSelect,
	transitionToStreetViewTrigger,
}) => {
	const closeTooltip = useInfoTooltipStore((s) => s.closeTooltip);
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
			onClick={() => {
				closeTooltip();
				onSelect(index);
			}}
			onKeyDown={handleKeyDown}
			aria-pressed={selected}
			className={`absolute border border-gray-900 cursor-pointer transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${backgroundClass} ${selected ? "shadow-2xl" : "shadow-xl"}`}
			style={{
				top: 0,
				left: stackPosition.leftOffset,
				zIndex: stackPosition.zIndex,
				transformOrigin: "70% 60%",
				transform:
					stackPosition.transformStyle || `scale(${stackPosition.scale})`,
			}}
		>
			<div className="flex flex-col justify-between h-full relative aspect-square">
				{/* HEADER */}
				<div className="absolute bottom-0 left-0 z-10 flex w-full h-1/3 flex-col justify-end bg-gradient-to-t from-white/80 to-transparent p-5 overflow-visible">
					<div className="flex gap-5 items-center max-w-md overflow-visible">
						<h2 className="text-4xl 2xl:text-5xl font-pixel">
							{match.address?.split(",")[0] ?? ""}
						</h2>
						{match.bikeLaneTypes?.map((type) => (
							<InfoTooltip
								key={type}
								type={type}
								content={getBikeLaneTypeDescription(type)}
							>
								<Pill
									value={getBikeLaneTypeLabel(type)}
									className="flex-shrink-0 bg-black text-bp-gray-loading overflow-visible cursor-help"
								>
									<img
										src="/info-icon-white.svg"
										alt="Info"
										className="w-5 h-5 pointer-events-none"
									/>
								</Pill>
							</InfoTooltip>
						))}
					</div>
					<p className="text-base 2xl:text-lg py-1.5 text-start">
						{match.district ?? ""}
					</p>
				</div>

				{/* IMAGE */}
				<div className="bg-amber-200 relative">
					{imageSrc && (
						<MatchTinyWorldImg
							imageUrl={imageSrc}
							shouldAnimate={selected}
							width={isLargeScreen ? 850 : 600}
							height={isLargeScreen ? 850 : 600}
							transitionToStreetViewTrigger={transitionToStreetViewTrigger}
						/>
					)}
				</div>
			</div>
		</div>
	);
};
