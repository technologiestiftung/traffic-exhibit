import { useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useScreenStore } from "../../stores/useScreenStore";
import { EqualSegmentsDisc } from "./equal-segment-disk";
import VisualizationApp from "./data-test";
import { i18n } from "../../i18n/i18n-utils";
import { trafficColors } from "../match/utils";

export const Start = () => {
	const { occupiedBlocks } = useWebSocket();
	const { setLoadingScreen } = useScreenStore();
	const [isAllDataVisible, setIsAllDataVisible] = useState(false);

	return (
		<div className="h-screen w-full overflow-y-auto bg-gradient-to-b from-[#171719] via-[#3b3b41] to-[#d7d7dd] text-white">
			<div className="mx-auto flex min-h-full max-w-[1540px] flex-col items-center justify-center gap-10 px-6 pb-12 pt-[calc(3rem+2cm)] lg:px-10">
				<div className="flex w-full flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
					<div className="relative flex flex-1 flex-col items-center gap-8">
						<div className="relative">
							{/* Decorative icons around the disc (desktop only) */}
							<div className="pointer-events-none absolute inset-0 hidden lg:block">
								<img
									src="/bike.svg"
									alt="bike"
									className="absolute -right-40 bottom-20 w-36 rotate-[-10deg] opacity-90 drop-shadow-[0_12px_22px_rgba(0,0,0,0.45)]"
								/>
								<img
									src="/walking.svg"
									alt="walking"
									className="absolute -left-36 top-20 w-32 rotate-[-18deg] opacity-90 drop-shadow-[0_12px_22px_rgba(0,0,0,0.45)]"
								/>
								<img
									src="/lkw.svg"
									alt="truck"
									className="absolute -left-44 bottom-10 w-40 rotate-[12deg] opacity-90 drop-shadow-[0_12px_22px_rgba(0,0,0,0.45)]"
								/>
							</div>

							<div className="absolute -top-6 -right-40 hidden rotate-6 items-center justify-center lg:flex">
								{/* Local SVG badge (no background). Placed in `apps/web-app/public/icon.svg`. */}
								<img
									src="/icon.svg"
									width={72 * 2.5}
									height={48 * 2.5}
									alt="badge"
									className="block"
								/>
							</div>
							<svg
								aria-hidden
								width="220"
								height="60"
								viewBox="0 0 220 60"
								className="absolute -top-16 -right-12 hidden text-black/70 lg:block"
							/>

							<div className="relative flex items-center justify-center rounded-full border-[14px] border-black bg-gradient-to-b from-[#1b1b1e] to-[#333338] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
								<EqualSegmentsDisc
									size={520}
									occupiedBlocks={occupiedBlocks}
									segmentColors={[
										{ occupied: trafficColors.yellow, empty: "#d9d9d9" },
									]}
									showLabels
								/>
								<div className="pointer-events-none absolute inset-16 flex items-center justify-center">
									<div className="relative flex h-60 w-60 items-center justify-center rounded-full bg-black/80">
										<div className="absolute inset-4 rounded-full border-4 border-bp-yellow" />
										<div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full bg-[#25252a] text-bp-yellow">
											{/* center icon: use the provided flip.svg in public */}
											<div
												aria-hidden
												className="h-12 w-12 bg-white"
												style={{
													WebkitMask:
														"url(/flip.svg) center / contain no-repeat",
													mask: "url(/flip.svg) center / contain no-repeat",
												}}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="flex max-w-md flex-1 flex-col items-start gap-4 text-left text-white drop-shadow-lg">
						<h1 className="text-5xl font-semibold tracking-wide font-title">
							{i18n("start.title")}
						</h1>
						<p className="text-lg text-white/80">{i18n("start.subHeading")}</p>
						<p className="text-base text-white/70">
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

				<div className="flex flex-col items-center gap-4 text-sm text-white/80">
					<button
						className="rounded-md border border-white/40 bg-white/10 px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/20"
						onClick={() => setIsAllDataVisible(!isAllDataVisible)}
					>
						{isAllDataVisible
							? i18n("start.showAllDataButton.label")
							: i18n("start.hideAllDataButton.label")}
					</button>
					{isAllDataVisible && (
						<div className="w-full rounded-3xl bg-white/85 p-6 text-left text-[#111] shadow-2xl">
							<VisualizationApp />
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
