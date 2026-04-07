import type { CircleChartSegment } from "../charts/circle-chart/circle-chart-utils";

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
							backgroundColor: segment.color,
							color: "#1a1a1a",
						}}
					>
						<span className="flex items-center gap-3">
							{(() => {
								const iconSrc = iconForSegmentName(segment.name);
								if (!iconSrc) {
									return null;
								}

								return (
									<img
										alt=""
										aria-hidden="true"
										src={iconSrc}
										className="h-4 w-6 2xl:h-5"
										style={{
											filter:
												"brightness(0) saturate(100%) drop-shadow(0 1px 0 rgba(0,0,0,0.12))",
										}}
									/>
								);
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
