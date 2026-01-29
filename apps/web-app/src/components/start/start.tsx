import { useScreenStore } from "../../stores/useScreenStore";
import { i18n } from "../../i18n/i18n-utils";
import { StartLayout } from "./start-layout";
// import { useState } from "react";
// import VisualizationApp from "./data-test";

export const Start = () => {
	const { setLoadingScreen } = useScreenStore();
	// const [isAllDataVisible, setIsAllDataVisible] = useState(false);

	return (
		<StartLayout variant="start">
			<h1 className="text-7xl 2xl:text-8xl font-pixel font-semibold tracking-wide font-title mb-4">
				{i18n("start.title")}
			</h1>
			<h2 className="text-3xl 2xl:text-4xl font-semibold tracking-wide">
				{i18n("start.subHeading")}
			</h2>
			<p className="text-lg 2xl:text-xl text-white/70">
				{i18n("start.description")}
			</p>
			<button
				className="mt-2 rounded-full border-2 border-black bg-black px-6 py-3 text-lg font-semibold text-white shadow-[0_10px_20px_rgba(0,0,0,0.55)] transition hover:-translate-y-0.5 hover:bg-[#111]"
				onClick={() => setLoadingScreen()}
			>
				{i18n("start.simulateButton.label")}
			</button>

			{/* commented out - only needed for testing */}
			{/* <div className="flex flex-col items-center gap-4 text-sm text-white/80">
				<button
					className="rounded-md border border-white/40 bg-white/10 px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/20"
					onClick={() => setIsAllDataVisible(!isAllDataVisible)}
				>
					{isAllDataVisible
						? i18n("start.hideAllDataButton.label")
						: i18n("start.showAllDataButton.label")}
				</button>
				{isAllDataVisible && (
					<div className="w-full rounded-3xl bg-white/85 p-6 text-left text-[#111] shadow-2xl">
						<VisualizationApp />
					</div>
				)}
			</div> */}
		</StartLayout>
	);
};
