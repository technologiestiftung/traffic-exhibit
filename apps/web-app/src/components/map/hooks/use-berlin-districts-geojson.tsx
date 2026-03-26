import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";

export type BerlinMapGeojson = {
	city: FeatureCollection | null;
	districts: FeatureCollection | null;
};

export function useBerlinGeojson(): BerlinMapGeojson {
	const [data, setData] = useState<BerlinMapGeojson>({
		city: null,
		districts: null,
	});

	useEffect(() => {
		const abortController = new AbortController();

		const fetchData = async () => {
			const [berlinRaw, bezirksRaw] = await Promise.all([
				fetch("/data/berlin.geojson", {
					signal: abortController.signal,
				}),
				fetch("/data/bezirksgrenzen.geojson", {
					signal: abortController.signal,
				}),
			]);
			const [berlinParsed, bezirksParsed] = await Promise.all([
				berlinRaw.json(),
				bezirksRaw.json(),
			]);
			setData({
				city: berlinParsed,
				districts: bezirksParsed,
			});
		};

		fetchData().catch((error) => {
			if (error.name === "AbortError") {
				return;
			}

			console.error(error);
		});

		return () => abortController.abort();
	}, []);

	return data;
}
