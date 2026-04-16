import { useState } from "react";
import type { CircleChartSegment } from "../charts/circle-chart/circle-chart-utils";
import { trafficColorsLight } from "./utils";

function DescriptionIcon({ iconSrc }: { iconSrc: string }) {
	const [loaded, setLoaded] = useState(false);

	return (
		<span className="relative inline-block h-4 w-6 shrink-0 2xl:h-5 2xl:w-8">
			{!loaded && (
				<span
					className="absolute inset-0 rounded-sm bg-neutral-600/25 animate-pulse"
					aria-hidden
				/>
			)}
			<img
				alt=""
				aria-hidden="true"
				src={iconSrc}
				onLoad={() => setLoaded(true)}
				className={`relative h-full w-full object-contain transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
				style={{
					filter:
						"brightness(0) saturate(100%) drop-shadow(0 1px 0 rgba(0,0,0,0.12))",
				}}
			/>
		</span>
	);
}

type MatchDescriptionProps = {
	data: CircleChartSegment[];
	coordinates: number[][];
};

const iconForSegmentName = (name: string): string | null => {
	const n = name.trim().toLowerCase();
	// Support both English and German labels (and plurals)
	if (
		n.includes("pedestrian") ||
		n.includes("pedestrians") ||
		n.includes("fuß") ||
		n.includes("fuss")
	) {
		return "/walking_icon.svg";
	}
	if (n.includes("bike") || n.includes("bikes") || n.includes("fahrr")) {
		return "/bike_icon.svg";
	}
	if (n.includes("car") || n.includes("cars") || n.includes("auto")) {
		return "/Car_icon.svg";
	}
	if (
		n.includes("heavy vehicle") ||
		n.includes("heavy vehicles") ||
		n.includes("truck") ||
		n.includes("trucks") ||
		n.includes("lkw")
	) {
		return "/LKW_icon.svg";
	}
	return null;
};

export const MatchDescription = ({ data }: MatchDescriptionProps) => {
	const sortedDescendingData = [...data].sort(
		(a, b) => b.percentage - a.percentage,
	);

	return (
		<div className="flex w-full flex-col self-center text-slate-800 lg:ml-auto">
			<ul className="space-y-3">
				{sortedDescendingData.map((segment, index) => (
					<li
						key={`legend-${segment.name}-${index}`}
						className="flex items-center justify-between border border-gray-600 px-4 py-2 text-sm font-semibold shadow rounded-xs"
						style={{
							backgroundColor: trafficColorsLight[segment.color] ?? segment.color,
							color: "#1a1a1a",
						}}
					>
						<span className="flex items-center gap-3">
							{(() => {
								const iconSrc = iconForSegmentName(segment.name);
								if (!iconSrc) {
									return null;
								}

								return <DescriptionIcon iconSrc={iconSrc} />;
							})()}
							<span className="text-base 2xl:text-lg">{segment.name}</span>
						</span>
						<span className="font-numbers">{`${segment.percentage}%`}</span>
					</li>
				))}
			</ul>
		</div>
	);
};
