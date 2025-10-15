import { useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useScreenStore } from "../../stores/useScreenStore";
import { i18n } from "../../i18n/i18n-utils";
import { EqualSegmentsDisc } from "./equal-segment-disk";
import VisualizationApp from "./data-test";

export const Start = () => {
	const { occupiedBlocks } = useWebSocket();
	const { setLoadingScreen } = useScreenStore();

	const [isAllDataVisible, setIsAllDataVisible] = useState(false);

	return (
		<div className="flex flex-col items-center gap-10 text-center">
			<div>
				<h1 className="text-3xl font-bold">{i18n("start.title")}</h1>
				<p className="text-2xl py-2">{i18n("start.description")}</p>
			</div>
			<div className="flex justify-between w-full">
				<EqualSegmentsDisc size={650} occupiedBlocks={occupiedBlocks} />
				<div className="flex flex-col items-center justify-center gap-6">
					<h2 className="2xl font-bold text-center">
						{i18n("start.subHeading")}
					</h2>
					<p className="text-lg text-center">{i18n("start.infoText")}</p>

					<button
						className="cursor-pointer rounded-sm p-4 hover:bg-green-200 bg-green-300 justify-self-end"
						onClick={() => setLoadingScreen()}
					>
						{i18n("start.simulateButton.label")}
					</button>
				</div>
			</div>
			<button
				className="underline"
				onClick={() => setIsAllDataVisible(!isAllDataVisible)}
			>
				{isAllDataVisible ? "Alle Daten verbergen" : "Alle Daten anzeigen"}
			</button>
			{isAllDataVisible && <VisualizationApp />}
		</div>
	);
};
