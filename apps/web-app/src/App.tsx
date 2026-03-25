import { useEffect, useState } from "react";
import { useScreenStore } from "./stores/useScreenStore";
import { Start } from "./components/start/start";
import { Loading } from "./components/loading/loading";
import { Match } from "./components/match/match";

function App() {
	const { currentScreen } = useScreenStore();
	const [matchReady, setMatchReady] = useState(false);

	// When on match screen, wait for page render to finish then reveal (avoids showing half-rendered content)
	useEffect(() => {
		if (currentScreen !== "match") {
			setMatchReady(false);
			return undefined;
		}
		let afterRenderedFrameId: number;
		const beforeRenderedFrameId = requestAnimationFrame(() => {
			afterRenderedFrameId = requestAnimationFrame(() => {
				setMatchReady(true);
			});
		});
		return () => {
			cancelAnimationFrame(beforeRenderedFrameId);
			if (afterRenderedFrameId !== undefined) {
				cancelAnimationFrame(afterRenderedFrameId);
			}
		};
	}, [currentScreen]);

	return (
		<div className="h-full w-full overflow-hidden">
			{currentScreen === "start" && <Start />}
			{currentScreen === "loading" && <Loading />}
			{currentScreen === "match" && (
				<div
					className="transition-opacity duration-300 ease-out"
					style={{
						opacity: matchReady ? 1 : 0,
						pointerEvents: matchReady ? undefined : "none",
					}}
					aria-hidden={!matchReady}
				>
					<Match />
				</div>
			)}
		</div>
	);
}

export default App;
