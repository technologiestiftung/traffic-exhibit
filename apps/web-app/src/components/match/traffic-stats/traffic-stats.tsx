import React from "react";
import type { TelraamMatch } from "../../../../../api/src/common";
import { formatDdMmmYyyy, getTrafficModal } from "../utils";
import { i18n } from "../../../i18n/i18n-utils";

type TrafficStatsProps = {
	telraamMatch: TelraamMatch;
};

export const TrafficStats: React.FC<TrafficStatsProps> = ({ telraamMatch }) => {
	const trafficModal = getTrafficModal(telraamMatch);

	return (
		<div className="absolute flex flex-col gap-2 top-0 right-0 p-2.5">
			<div className="flex flex-col text-end text-red-500 bg-white bg-opacity-50 rounded-sm px-2">
				{/* pulsing dot */}
				<div>
					<div className="w-3 h-3 bg-red-500 rounded-full animate-pulse inline-block mr-2" />
					<span className="font-semibold">{i18n("trafficStats.liveData")}</span>
				</div>
				<span className="text-sm">
					{" "}
					{formatDdMmmYyyy(telraamMatch?.originalProperties?.date)}
				</span>
			</div>

			{trafficModal.map((item) => (
				<div
					key={item.name}
					className="flex flex-col w-fit self-end text-black bg-white bg-opacity-50 rounded-sm px-2 py-1"
				>
					<p className="text-end">{item.name}</p>
					{item.percentage !== undefined && (
						<p className="text-end font-semibold">{`${item.percentage}%`}</p>
					)}
				</div>
			))}
		</div>
	);
};
