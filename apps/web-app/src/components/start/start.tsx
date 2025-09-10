import { useWebSocket } from "../../hooks/useWebSocket";
import { useScreenStore } from "../../stores/useScreenStore";

export const Start = () => {
	const { numbers } = useWebSocket();
	const { setLoadingScreen } = useScreenStore();

	return (
		<div>
			<h1 className="text-3xl font-bold">Start Screen</h1>
			<p className="text-2xl py-2">Belegte Blocks</p>
			<div className="flex gap-2 mb-4">
				{Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
					<div
						key={num}
						className={`w-10 h-10 flex items-center justify-center border rounded ${
							numbers.includes(num) ? "bg-green-300" : "bg-white"
						}`}
					>
						{num}
					</div>
				))}
			</div>
			<button
				className="cursor-pointer rounded-sm p-2 hover:bg-green-200 bg-green-300"
				onClick={() => setLoadingScreen()}
			>
				Start simulieren
			</button>
		</div>
	);
};
