import { useWebSocket } from "./hooks/useWebSocket";

function App() {
	const { numbers, stopMotor } = useWebSocket();

	return (
		<div>
			<h1>Camera Data: {numbers.join(", ")}</h1>
			<button onClick={stopMotor}>Stop Motor</button>
		</div>
	);
}

export default App;
