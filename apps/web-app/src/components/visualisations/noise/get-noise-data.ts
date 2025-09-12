export async function fetchLden(lat: number, lon: number) {
	const r = await fetch(`/api/lden2017?lat=${lat}&lon=${lon}`);

	if (!r.ok) {
		const text = await r.text().catch(() => "");
		throw new Error(`API ${r.status} ${r.statusText} – ${text.slice(0, 200)}`);
	}

	const ct = r.headers.get("content-type") ?? "";
	if (!ct.includes("application/json")) {
		const text = await r.text();
		throw new Error(
			`Expected JSON, got: ${ct}. First bytes: ${text.slice(0, 100)}`,
		);
	}

	return (await r.json()) as {
		lden: number | null;
		unit: string;
		distance_m: number | null;
	};
}
