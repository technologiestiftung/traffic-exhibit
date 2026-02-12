import React from "react";
import { formatDdMmmYyyy } from "../match/utils";
import { i18n } from "../../i18n/i18n-utils";

type DataDateIndicatorProps = {
	telraamDataDate: string;
};

export const DataDateIndicator: React.FC<DataDateIndicatorProps> = ({
	telraamDataDate,
}) => {
	return (
		<div className="absolute flex flex-col gap-2 top-0 right-0 p-2.5">
			<div className="flex flex-col text-end text-red-500 bg-white bg-opacity-50 rounded-sm px-2">
				{/* pulsing dot */}
				<div>
					<div className="w-3 h-3 bg-red-500 rounded-full animate-pulse inline-block mr-2" />
					<span className="font-semibold">{i18n("trafficStats.liveData")}</span>
				</div>
				<span className="text-sm font-numbers">
					{" "}
					{formatDdMmmYyyy(telraamDataDate)}
				</span>
			</div>
		</div>
	);
};
