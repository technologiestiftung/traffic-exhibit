import { useWebSocket } from "../../hooks/useWebSocket";
import { BerlinMap } from "../map/berlin-map";

export const Match = () => {
	const { goBackToStart, telraamMatch } = useWebSocket();
	return (
		<div>
			<div className="flex flex-row items-center justify-center p-4 space-y-4">
				<div>
					<h1 className="text-3xl font-bold">Match Screen</h1>
					<p className="text-2xl py-2">Dein Verkehrs-Mix passt zu ...</p>
					{telraamMatch && (
						<div>
							<p className="pb-2">
								Luftqualitätsstufe: {telraamMatch.airQuality}
							</p>
							<p className="pb-2">
								Fahrradwegtypen: {telraamMatch.bikeLaneTypes.join(", ")}
							</p>
							<p className="pb-2">
								Lärmpegel: {telraamMatch.nearestNoiseLevel} dB
							</p>
							<p className="pb-2">Bezirk: {telraamMatch.district}</p>
							<p className="pb-2">Adresse: {telraamMatch.address}</p>
							<img
								src={telraamMatch.imageURL}
								alt="Street view"
								className="w-96 h-auto rounded-md shadow-md"
							/>
						</div>
					)}
				</div>
				<div>
					{telraamMatch && (
						<BerlinMap
							lat={telraamMatch.coordinates[0][1]}
							lon={telraamMatch.coordinates[0][0]}
						/>
					)}
				</div>
			</div>
			<button
				className="cursor-pointer rounded-sm p-2 hover:bg-green-200 bg-green-300"
				onClick={goBackToStart}
			>
				Neuen Mix erstellen
			</button>
		</div>
	);
};
