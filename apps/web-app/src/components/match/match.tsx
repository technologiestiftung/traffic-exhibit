import { useWebSocket } from "../../hooks/useWebSocket";

export const Match = () => {
	const { goBackToStart } = useWebSocket();

	return (
		<div>
			<h1 className="text-3xl font-bold">Match Screen</h1>
			<p className="text-2xl py-2">Dein Verkehrs-Mix passt zu ...</p>
			<button
				className="cursor-pointer rounded-sm p-2 hover:bg-green-200 bg-green-300"
				onClick={goBackToStart}
			>
				Neuen Mix erstellen
			</button>
		</div>
	);
};
