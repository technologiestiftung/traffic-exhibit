import { useEffect, useState } from "react";
import { getNoise } from "./get-noise-data";

type NoiseChartProps = { lat: number; lon: number };

export const NoiseChart = ({ lat, lon }: NoiseChartProps) => {
	const [noiseIndex, setNoiseIndex] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setError(null);
		setNoiseIndex(null);

		getNoise(lat, lon)
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
			<h2>Lärmindex</h2>
			{error ? (
				<p style={{ color: "red" }}>Error: {error}</p>
			) : (
				<p>{noiseIndex !== null ? `${noiseIndex} dB(A)` : "Loading..."}</p>
			)}
		</div>
	);
};
