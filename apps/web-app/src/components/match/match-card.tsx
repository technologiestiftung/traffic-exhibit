import React from "react";
import { Pill } from "../pill/pill";
import type { TelraamMatch } from "../../../../api/src/common";
import { MatchTinyWorldImg } from "./match-tiny-world-img";
import {
	getImageUrl,
	getDominantTrafficModalIndex,
	getDominantTrafficGradientClass,
} from "./utils";

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
				<div className="absolute bottom-0 left-0 z-10 flex w-full h-1/3 flex-col justify-end bg-gradient-to-t from-white/80 to-transparent p-5">
					<div className="flex gap-5 items-center max-w-md">
						<h2 className="text-4xl 2xl:text-5xl font-pixel">
							{match.address?.split(",")[0] ?? ""}
						</h2>
						{match.bikeLaneTypes?.map((type) => (
							<Pill
								key={type}
								value={type}
								className="bg-black font-pixel text-bp-gray-loading"
							/>
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
						/>
					)}
				</div>
			</div>
		</div>
	);
};
