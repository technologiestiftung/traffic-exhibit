import { useWebSocket } from "../../hooks/useWebSocket";
import { BerlinMap } from "../map/berlin-map";
import { NoiseChart } from "../charts/noise-chart";
import { Pill } from "../pill/pill";
import { AirQualityChart } from "../charts/air-quality-chart";
import { parse, format } from "date-fns";

export const Match = () => {
	const { goBackToStart, telraamMatch } = useWebSocket();
	const trafficModal = [
		{
			name: "Fußgänger",
			count: telraamMatch?.originalProperties.pedestrian,
			percentage: telraamMatch?.originalProperties.pedestrian_percentage,
		},
		{
			name: "Fahrräder",
			count: telraamMatch?.originalProperties.bike,
			percentage: telraamMatch?.originalProperties.bike_percentage,
		},
		{
			name: "Autos",
			count: telraamMatch?.originalProperties.car,
			percentage: telraamMatch?.originalProperties.car_percentage,
		},
		{
			name: "LKWs",
			count: telraamMatch?.originalProperties.heavy,
			percentage: telraamMatch?.originalProperties.heavy_percentage,
		},
	];

	const formatDdMmmYyyy = (value?: string) => {
		if (!value) return "";
		// matches: 2025-09-17 14:00:00+00:00
		const d = parse(value, "yyyy-MM-dd HH:mm:ssXXX", new Date());
		if (Number.isNaN(d.getTime())) return value;
		return format(d, "dd MMM yyyy"); // ← use yyyy, not YYYY
	};

	return (
		<div>
			<div className="flex flex-col justify-center p-4 max-w-[1280px] h-full space-y-7">
				<div className="flex justify-between items-center w-full">
					<h1 className="text-4xl font-bold">Dein Verkehrs-Mix passt zu ...</h1>
					<button
						className="cursor-pointer rounded-sm p-2 hover:bg-gray-200 bg-gray-300"
						onClick={goBackToStart}
					>
						Neuen Mix erstellen
					</button>
				</div>
				{/* COVER */}
				<div className="bg-gray-200 rounded-sm max-w-xl">
					{telraamMatch && (
						<>
							{/* HEADER */}
							<div className="flex justify-between items-center p-4 w-full">
								<div>
									<div className="flex gap-4 items-center max-w-md">
										<h2 className="text-2xl font-bold max-w-sm">
											{telraamMatch.address?.split(",")[0]}
										</h2>
										{telraamMatch.bikeLaneTypes.map((type) => (
											<Pill
												key={type}
												value={type}
												backgroundColor="bg-gray-500"
												textColor="text-gray-100"
											/>
										))}
									</div>
									<p className="text-xl py-2">{telraamMatch.district}</p>
								</div>
								<BerlinMap
									lat={telraamMatch.coordinates[0][1]}
									lon={telraamMatch.coordinates[0][0]}
									width={100}
									height={100}
								/>
							</div>
							{/* IMAGE */}
							<div className="w-full h-80 relative">
								<img
									src={telraamMatch.imageURL}
									alt="Street view"
									className="w-full h-full object-cover"
								/>
								{/* TRAFFIC COUNT */}
								<div className="absolute flex flex-col gap-2 top-0 right-0 p-3">
									<div className="flex flex-col items-center text-center text-red-500 bg-white bg-opacity-50 rounded-sm px-2">
										{/* pulsing dot */}
										<div>
											<div className="w-3 h-3 bg-red-500  rounded-full animate-pulse inline-block mr-2" />
											<span className="font-semibold">Livedaten</span>
										</div>
										<span className="text-sm">
											{formatDdMmmYyyy(telraamMatch?.originalProperties?.date)}
										</span>
									</div>

									{trafficModal.map((item) => (
										<div className="flex flex-col text-black bg-white bg-opacity-50 rounded-sm px-2 py-1 items-center">
											<div
												key={item.name}
												className="flex flex-col text-center"
											>
												<p>{item.name}</p>
												{item.count !== undefined &&
													item.percentage !== undefined && (
														<p className="flex gap-1">
															<span className="font-semibold">
																{item.count.toFixed(0)}
															</span>
															<span>
																({item.percentage.toFixed(0)}
																{"%"})
															</span>
														</p>
													)}
											</div>
										</div>
									))}
								</div>
							</div>
							{/* NOISE LEVEL */}
							<div className="flex flex-col gap-2 p-3.5">
								<h3 className="font-semibold">Lärmbelästigung</h3>
								<div className="flex justify-between items-center">
									<div className="w-full max-w-md">
										<NoiseChart
											value={telraamMatch.nearestNoiseLevel}
											markerSize={8}
										/>
									</div>
									<p className="font-bold">
										{telraamMatch.nearestNoiseLevel} dB
									</p>
								</div>
							</div>
							{/* AIR QUALITY */}
							<div className="flex flex-col gap-2 p-3.5">
								<h3 className="font-semibold">Luftqualitätsstufe</h3>
								<div className="flex justify-between items-center">
									<div className="w-full max-w-md">
										<AirQualityChart
											value={telraamMatch.airQuality}
											markerSize={8}
										/>
									</div>
									<p className="font-bold">{telraamMatch.airQuality} AQI</p>
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
};
