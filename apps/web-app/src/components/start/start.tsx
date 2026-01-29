// import { useState } from "react";
import { useScreenStore } from "../../stores/useScreenStore";
// import VisualizationApp from "./data-test";
import { i18n } from "../../i18n/i18n-utils";
import { StartWheel } from "./start-wheel";

export const Start = () => {
	const { setLoadingScreen } = useScreenStore();
	// const [isAllDataVisible, setIsAllDataVisible] = useState(false);

	return (
		<div className="h-screen w-full overflow-y-auto bg-gradient-to-b from-[#171719] via-[#3b3b41] to-[#d7d7dd] text-white">
			<div className="mx-auto flex min-h-full max-w-[1540px] xl:max-w-[1820px] flex-col items-center justify-center gap-10 px-6 xl:px-0 py-10">
				<div className="flex w-full flex-col gap-12 xl:gap-20 xl:flex-row xl:items-center xl:justify-center">
					<StartWheel />

					<div className="flex w-full max-w-md justify-start flex-1 flex-col items-start gap-4 text-left text-white drop-shadow-lg">
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
					</div>
				</div>

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
			</div>
		</div>
	);
};
