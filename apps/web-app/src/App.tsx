import { useScreenStore } from "./stores/useScreenStore";
import { Start } from "./components/start/start";
import { Loading } from "./components/loading/loading";
import { Match } from "./components/match/match";
import { BerlinMap } from "./components/map/berlin-map";
import { NoiseChart } from "./components/visualisations/noise/noise-chart";

function App() {
	const { currentScreen } = useScreenStore();
	// Example location:
	//Checkpoint Charlie
	const currentLocation = {
		lat: 52.507,
		lon: 13.390271,
	};

	return (
		<div className="p-5">
			{currentScreen === "start" && <Start />}
			{currentScreen === "loading" && <Loading />}
			{currentScreen === "match" && <Match />}
			<BerlinMap lat={currentLocation.lat} lon={currentLocation.lon} />
			<NoiseChart lat={currentLocation.lat} lon={currentLocation.lon} />
		</div>
	);
}

export default App;
