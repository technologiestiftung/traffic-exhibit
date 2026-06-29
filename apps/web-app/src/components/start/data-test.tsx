import React from "react";
import data from "../../../../api/data/enriched-telraam-data.json";

interface Segment {
	segment_id: number;
	coordinates: number[][];
	bikeLaneTypes: string[];
	nearestNoiseLevel: number | null;
	address: string;
	district: string | null;
	imageURL: string | null;
	airQuality: number | null;
	originalProperties: {
		car_percentage?: number | null;
		bike_percentage?: number | null;
		pedestrian_percentage?: number | null;
		heavy_percentage?: number | null;
	};
}

const DataCard: React.FC<{ segment: Segment }> = ({ segment }) => {
	const {
		car_percentage,
		bike_percentage,
		pedestrian_percentage,
		heavy_percentage,
	} = segment.originalProperties;

	const getImageUrl = (imageURL: string | null): string | null => {
		if (!imageURL) {
			return null;
		}

		if (imageURL.includes("../")) {
			const filename = imageURL.split("/").pop();
			return filename ? `/api/data/raw-images/${filename}` : null;
		}

		const match = imageURL.match(/data\/raw-images\/[^/]+$/);
		return match ? `/api/${match[0]}` : null;
	};

	const chartData = [
		{ label: "PKWs", value: car_percentage ?? 0, color: "#FF6384" },
		{ label: "Rad", value: bike_percentage ?? 0, color: "#c8ff00" },
		{ label: "Zu Fuß", value: pedestrian_percentage ?? 0, color: "#4BC0C0" },
		{ label: "LKWs", value: heavy_percentage ?? 0, color: "#FFCE56" },
	].filter((item) => item.value > 0);

	const maxValue = Math.max(...chartData.map((item) => item.value), 1);

	const getNoiseColor = (noiseLevel: number) => {
		const ratio = Math.min(noiseLevel / 80, 35);
		const yellow = Math.round(255 * (1 - ratio * 0.5));
		const red = Math.round(255 * ratio);
		return `rgb(${red}, ${yellow}, 0)`;
	};

	const formatNoiseDisplay = (noiseLevel: number | null): string => {
		return noiseLevel === null ? "Keine Daten" : `${noiseLevel}`;
	};

	const currentNoiseLevel = segment.nearestNoiseLevel;
	const noiseDisplay = formatNoiseDisplay(currentNoiseLevel);
	const imageSrc = segment.imageURL ? getImageUrl(segment.imageURL) : null;

	return (
		<div className="border rounded-lg p-4 bg-gray-50 shadow-sm w-[450px]">
			<h3 className="text-lg font-semibold mb-2">{segment.address}</h3>
			{imageSrc && (
				<img
					className="w-full h-auto rounded-md"
					src={imageSrc}
					alt="Segment"
					onError={(e) => {
						e.currentTarget.style.display = "none";
					}}
				/>
			)}
			<div className="flex flex-row justify-start items-center mt-4">
				<div className="flex flex-col p-3 text-left shrink-0 gap-3">
					<div className="flex flex-row gap-2">
						<strong>Straßentyp</strong>{" "}
						{segment.bikeLaneTypes.length > 0 ? (
							<div className="bg-yellow-300 rounded-full px-2 inline-block w-fit">
								{segment.bikeLaneTypes.join(", ")}
							</div>
						) : (
							<div className="bg-red-300 rounded-full px-2 inline-block w-fit">
								kein Radnetz
							</div>
						)}
					</div>
					<p>
						<strong>Nearest Noise Level:</strong>
					</p>
					<div className="flex items-center gap-2">
						<div className="flex-1 bg-gray-200 rounded h-4 relative overflow-hidden">
							{currentNoiseLevel !== null && (
								<div
									className="h-full rounded"
									style={{
										backgroundColor: getNoiseColor(currentNoiseLevel),
										width: `${(currentNoiseLevel / 100) * 100}%`,
									}}
								/>
							)}
						</div>
						<span className="text-xs">
							{noiseDisplay}
							{noiseDisplay !== "Keine Daten" && " dB"}
						</span>
					</div>
					<div>
						<strong>Bedarf für Luftverbesserung:</strong>
						<div className="flex gap-1 mt-1">
							{[1, 2, 3, 4, 5].map((level) => (
								<div
									key={level}
									className={`w-4 h-4 rounded border ${
										segment.airQuality === level
											? "border-blue-700 border-2"
											: "border-gray-300"
									}`}
									style={{
										backgroundColor: `rgba(236, 72, 153, ${level * 0.2})`, // Pink with increasing opacity
										boxShadow:
											segment.airQuality === level
												? "0 0 4px rgba(236, 72, 153, 0.8)"
												: "none",
									}}
								/>
							))}

							<span className="text-xs">{segment.airQuality}</span>
						</div>
					</div>
					<p>{segment.district || "Unknown District"}</p>
				</div>
				<div className="w-1/2 h-full mr-4">
					<div className="h-full flex flex-col gap-1">
						{chartData.map((item, index) => (
							<div key={index} className="flex items-center gap-2">
								<span className="text-xs w-16 text-right">{item.label}:</span>
								<div className="flex-1 bg-gray-200 rounded h-4 relative">
									<div
										className="h-full rounded"
										style={{
											backgroundColor: item.color,
											width: `${(item.value / maxValue) * 100}%`,
										}}
									/>
								</div>
								<span className="text-xs w-8">{item.value.toFixed(1)}%</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

const App: React.FC = () => {
	const filteredData = Array.isArray(data) ? (data as Segment[]) : [];

	return (
		<div className="flex flex-wrap gap-10 p-5 justify-center">
			{filteredData.map((segment) => (
				<DataCard key={segment.segment_id} segment={segment} />
			))}
		</div>
	);
};

export default App;
