import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";

export function useBerlinDistrictsGeojson() {
	const [geoJson, setGeoJson] = useState<FeatureCollection | null>(null);

	useEffect(() => {
		const abortController = new AbortController();

		const fetchData = async () => {
			const berlinBezirkeRaw = await fetch("/data/bezirksgrenzen.geojson", {
				signal: abortController.signal,
			});
			const berlinBezirkeParsed = await berlinBezirkeRaw.json();
			setGeoJson(berlinBezirkeParsed);
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
