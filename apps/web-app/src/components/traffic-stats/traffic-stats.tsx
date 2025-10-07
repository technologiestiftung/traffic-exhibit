import React from "react";
import type { TelraamMatch } from "../../../../api/src/common";
import { formatDdMmmYyyy } from "./traffic-stats-utils";
import { i18n } from "../../i18n/i18n-utils";

type TrafficStatsProps = {
	telraamMatch: TelraamMatch;
};

export const TrafficStats: React.FC<TrafficStatsProps> = ({ telraamMatch }) => {
	const trafficModal = [
		{
			name: i18n("trafficStats.pedestrians"),
			count: telraamMatch?.originalProperties.pedestrian,
			percentage: telraamMatch?.originalProperties.pedestrian_percentage,
		},
		{
			name: i18n("trafficStats.bikes"),
			count: telraamMatch?.originalProperties.bike,
			percentage: telraamMatch?.originalProperties.bike_percentage,
		},
		{
			name: i18n("trafficStats.cars"),
			count: telraamMatch?.originalProperties.car,
			percentage: telraamMatch?.originalProperties.car_percentage,
		},
		{
			name: i18n("trafficStats.trucks"),
			count: telraamMatch?.originalProperties.heavy,
			percentage: telraamMatch?.originalProperties.heavy_percentage,
		},
	];

	return (
		<div className="absolute flex flex-col gap-2 top-0 right-0 p-3">
			<div className="flex flex-col items-center text-center text-red-500 bg-white bg-opacity-50 rounded-sm px-2">
				{/* pulsing dot */}
				<div>
					<div className="w-3 h-3 bg-red-500 rounded-full animate-pulse inline-block mr-2" />
					<span className="font-semibold">Livedaten</span>
				</div>
				<span className="text-sm">
					{" "}
					{formatDdMmmYyyy(telraamMatch?.originalProperties?.date)}
				</span>
			</div>

			{trafficModal.map((item) => (
				<div
					key={item.name}
					className="flex flex-col text-black bg-white bg-opacity-50 rounded-sm px-2 py-1 items-center"
				>
					<div className="flex flex-col text-center">
						<p>{item.name}</p>
						{item.count !== undefined && item.percentage !== undefined && (
							<p className="flex gap-1">
								<span className="font-semibold">{item.count.toFixed(0)}</span>
								<span>
									({item.percentage.toFixed(0)}
									{"%"})
								</span>
							</p>
						)}
					</div>
				</div>
			))}
		</div>
	);
};
