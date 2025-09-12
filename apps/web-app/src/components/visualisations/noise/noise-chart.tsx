import { useEffect, useState } from "react";
import { fetchLden } from "./get-noise-data";

type NoiseChartProps = { lat: number; lon: number };

export const NoiseChart = ({ lat, lon }: NoiseChartProps) => {
	const [noiseIndex, setNoiseIndex] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setError(null);
		setNoiseIndex(null);

		fetchLden(lat, lon)
			.then((json) => {
				if (!cancelled) {
					setNoiseIndex(json.lden);
				}
			})
			.catch((e) => {
				if (!cancelled) {
					setError(String(e));
				}
			});

		return () => {
			cancelled = true;
		};
	}, [lat, lon]);

	return (
		<div>
			<h2>Noise Chart</h2>
			{error ? (
				<p style={{ color: "red" }}>Error: {error}</p>
			) : (
				<p>LDEN: {noiseIndex !== null ? noiseIndex : "Loading..."}</p>
			)}
		</div>
	);
};
