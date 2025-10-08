import { useWebSocket } from "../../hooks/useWebSocket";
import { BerlinMap } from "../map/berlin-map";
import { NoiseChart } from "../charts/noise-chart";
import { Pill } from "../pill/pill";
import { AirQualityChart } from "../charts/air-quality-chart";
import { TrafficStats } from "./traffic-stats/traffic-stats";
import { i18n } from "../../i18n/i18n-utils";
import { TrafficModalSplit } from "./traffic-modal-split/traffic-modal-split";

export const Match = () => {
	const { goBackToStart, telraamMatch } = useWebSocket();

	return (
		<>
			<div className="flex flex-col justify-center p-3 max-w-[1280px] h-full space-y-7">
				<div className="flex justify-between items-center w-full">
					<h1 className="text-4xl font-bold">{i18n("match.title")}</h1>
					<button
						className="cursor-pointer rounded-sm p-2 hover:bg-gray-200 bg-gray-300"
						onClick={goBackToStart}
					>
						{i18n("match.createNewMixButton.label")}
					</button>
				</div>
				{/* COVER */}
				<div className="relative flex items-center w-full h-full">
					<div className="bg-gray-200 rounded-sm  max-w-xl w-[600px] h-[600px] z-10">
						{telraamMatch && (
							<>
								{/* HEADER */}
								<div className="flex justify-between items-center p-3 w-full">
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
									{telraamMatch.originalProperties && (
										<TrafficStats telraamMatch={telraamMatch} />
									)}
								</div>

								{/* NOISE LEVEL */}
								<NoiseChart
									title={i18n("noiseChart.title")}
									value={telraamMatch.nearestNoiseLevel}
									markerSize={8}
								/>

								{/* AIR QUALITY */}
								<AirQualityChart
									title={i18n("airQualityChart.title")}
									value={telraamMatch.airQuality}
									markerSize={8}
								/>
							</>
						)}
					</div>
					{/* TRAFFIC VINYL */}
					{telraamMatch && (
						<TrafficModalSplit
							telraamMatch={telraamMatch}
							size={600}
							isLegendVisible={false}
						/>
					)}
				</div>
			</div>
		</>
	);
};
