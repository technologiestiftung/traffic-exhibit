import type { CircleChartSegment } from "../charts/circle-chart/circle-chart-utils";
import { lightenColor } from "../charts/circle-chart/circle-chart-utils";

type MatchDescriptionProps = {
	data: CircleChartSegment[];
	coordinates: number[][];
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
						className="flex items-center justify-between border border-gray-600 px-4 py-2 text-sm font-semibold shadow"
						style={{
							backgroundColor: lightenColor(segment.color, 0.55),
							color: "#1a1a1a",
						}}
					>
						<span className="flex items-center gap-3">
							<span
								aria-hidden="true"
								className="inline-block h-3 w-6 rounded-sm 2xl:h-4 2xl:w-8 border border-black/20"
								style={{ backgroundColor: segment.color }}
							/>
							<span className="text-base 2xl:text-lg">{segment.name}</span>
						</span>
						<span className="font-numbers">{`${segment.percentage}%`}</span>
					</li>
				))}
			</ul>
		</div>
	);
};
