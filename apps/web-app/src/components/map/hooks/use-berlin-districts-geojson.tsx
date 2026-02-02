import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";

export function useBerlinGeojson() {
	const [geoJson, setGeoJson] = useState<FeatureCollection | null>(null);

	useEffect(() => {
		const abortController = new AbortController();

		const fetchData = async () => {
			const berlinRaw = await fetch("/data/berlin.geojson", {
				signal: abortController.signal,
			});
			const berlinParsed = await berlinRaw.json();
			setGeoJson(berlinParsed);
		};

		fetchData().catch((error) => {
			if (error.name === "AbortError") {
				return;
			}

			console.error(error);
		});

		return () => abortController.abort();
	}, []);

	return geoJson;
}
