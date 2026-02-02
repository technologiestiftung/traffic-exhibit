import type { CircleChartSegment } from "../charts/circle-chart/circle-chart-utils";
import { lightenColor } from "../charts/circle-chart/circle-chart-utils";
import { i18n } from "../../i18n/i18n-utils";
import { BerlinMap } from "../map/berlin-map";

type MatchDescriptionProps = {
	data: CircleChartSegment[];
	coordinates: number[][];
};

export const MatchDescription = ({
	data,
	coordinates,
}: MatchDescriptionProps) => {
	const sortedDescendingData = [...data].sort(
		(a, b) => b.percentage - a.percentage,
	);
	const summary = describeSegments(data);

	return (
		<div className="flex lg:w-1/5 flex-col self-center text-slate-800 lg:ml-auto">
			{Array.isArray(coordinates) && Array.isArray(coordinates[0]) && (
				<BerlinMap
					lat={coordinates[0][1]}
					lon={coordinates[0][0]}
					width={270}
					height={270}
				/>
			)}
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
								className="inline-block h-3 w-6 rounded-sm border border-black/20"
								style={{ backgroundColor: segment.color }}
							/>
							<span>{segment.name}</span>
						</span>
						<span className="font-numbers">{`${segment.percentage}%`}</span>
					</li>
				))}
			</ul>
			<p className="text-base leading-relaxed mt-8">{summary}</p>
		</div>
	);
};

const describeSegments = (segments: CircleChartSegment[]): string | null => {
	if (!segments.length) {
		return null;
	}

	const totalCount = segments.reduce((sum, segment) => sum + segment.count, 0);
	const sorted = [...segments].sort((a, b) => b.percentage - a.percentage);
	const topSegment = sorted[0];
	const trailingSegment = sorted[sorted.length - 1];
	const categories = segments.length;

	const trailingMessage =
		trailingSegment &&
		trailingSegment !== topSegment &&
		` ${i18n("circleChart.summary.trailingMessage.p1")} ${trailingSegment.name} ${i18n("circleChart.summary.trailingMessage.p2")} ${trailingSegment.percentage}% `;

	const totalMessage =
		totalCount &&
		`${i18n("circleChart.summary.totalMessage.p1")} ${totalCount.toLocaleString()} ${i18n("circleChart.summary.totalMessage.p2")}`;

	return `${topSegment.name} ${i18n("circleChart.summary.leadsThisMessage.p1")} ${categories}${i18n("circleChart.summary.leadsThisMessage.p2")} ${topSegment.percentage}%${trailingMessage}${totalMessage}${i18n("circleChart.summary.usageDistributionMessage")}`;
};
