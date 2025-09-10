import { useScreenStore } from "./stores/useScreenStore";
import { Start } from "./components/start/start";
import { Loading } from "./components/loading/loading";
import { Match } from "./components/match/match";

function App() {
	const { currentScreen } = useScreenStore();

	return (
		<div className="p-5">
			{currentScreen === "start" && <Start />}
			{currentScreen === "loading" && <Loading />}
			{currentScreen === "match" && <Match />}
		</div>
	);
}

export default App;
