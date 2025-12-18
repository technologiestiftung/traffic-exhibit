import { useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { useScreenStore } from "../../stores/useScreenStore";
import { EqualSegmentsDisc } from "./equal-segment-disk";
import VisualizationApp from "./data-test";

export const Start = () => {
	const { occupiedBlocks } = useWebSocket();
	const { setLoadingScreen } = useScreenStore();
	const [isAllDataVisible, setIsAllDataVisible] = useState(false);

	return (
		<div className="min-h-screen w-full bg-gradient-to-b from-[#2f3033] via-[#5b5b61] to-[#d7d7dd] text-[#141414]">
			<div className="mx-auto flex max-w-[1540px] flex-col items-center gap-10 px-6 py-12 text-center lg:px-10">
				<div>
					<h1 className="text-3xl font-bold text-white drop-shadow">
						Unser Verkehrs-Mix für Deine Straße
					</h1>
					<p className="text-lg py-2 text-gray-200">
						Wir zeigen Dir, welche Verkehrsteilnehmer:innen gerade unterwegs
						sind.
					</p>
				</div>

				<div className="flex w-full flex-col items-center justify-between gap-10 rounded-[32px] border border-black/40 bg-black/30 p-8 text-left text-white shadow-[0_35px_80px_rgba(0,0,0,0.45)] backdrop-blur lg:flex-row">
					<EqualSegmentsDisc
						size={650}
						occupiedBlocks={occupiedBlocks}
						segmentColors={[{ occupied: "#fefefe", empty: "#bdbdc0" }]}
						showLabels={false}
					/>

					<div className="flex max-w-md flex-col items-start gap-6 rounded-[30px] bg-white/85 p-8 text-left text-[#191919] shadow-xl">
						<h2 className="text-2xl font-semibold">
							Spüre den Puls Deiner Stadt.
						</h2>
						<p className="text-base text-[#2b2b31]">
							Simuliere Deinen persönlichen Verkehrs-Mix – live, individuell und
							unverwechselbar.
						</p>
						<button
							className="rounded-full border border-[#111] bg-black px-6 py-3 text-lg font-semibold text-white shadow-[0_15px_30px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 hover:bg-[#191919]"
							onClick={() => setLoadingScreen()}
						>
							Start simulieren
						</button>
					</div>
				</div>

				<div className="flex flex-col items-center gap-4 text-sm text-white/80">
					<button
						className="rounded-full border border-white/60 bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white transition hover:bg-white/40"
						onClick={() => setIsAllDataVisible(!isAllDataVisible)}
					>
						{isAllDataVisible
							? "Alle Daten verbergen"
							: "Alle Daten anzeigen"}
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
