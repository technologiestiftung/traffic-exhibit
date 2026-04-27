import { parse, format } from "date-fns";
import { i18n } from "../../i18n/i18n-utils";
import type { TelraamMatch } from "../../../../api/src/common";

export const formatDdMmmYyyy = (value?: string) => {
	if (!value) {
		return "";
	}
	const d = parse(value, "yyyy-MM-dd HH:mm:ssXXX", new Date());
	if (Number.isNaN(d.getTime())) {
		return value;
	}
	return format(d, "dd MMM yyyy");
};

export function clamp(n: number, min: number, max: number): number {
	return Math.min(Math.max(n, min), max);
}

export const getImageUrl = (imageURL: string | null): string | null => {
	if (!imageURL) {
		return null;
	}

	// Extract filename from relative paths
	if (imageURL.includes("../")) {
		const filename = imageURL.split("/").pop();
		return filename ? `/api/data/raw-images/${filename}` : null;
	}

	// Extract relative path from absolute paths
	const matchImage = imageURL.match(/data\/raw-images\/[^/]+$/);
	return matchImage ? `/api/${matchImage[0]}` : null;
};

// Traffic modal colors - references to CSS theme variables in index.css
export const trafficColors = {
	blue: "var(--color-bp-blue)",
	yellow: "var(--color-bp-yellow)",
	red: "var(--color-bp-red)",
	orange: "var(--color-bp-orange)",
} as const;

export const trafficColorsLight: Record<string, string> = {
	[trafficColors.blue]: trafficColors.blue,
	[trafficColors.yellow]: trafficColors.yellow,
	[trafficColors.red]: trafficColors.red,
	[trafficColors.orange]: "var(--color-bp-orange-light)",
};

// UI colors - references to CSS theme variables in index.css
export const uiColors = {
	grayLight: "var(--color-bp-gray-light)",
	grayDark: "var(--color-bp-gray-dark)",
	grayLoading: "var(--color-bp-gray-loading)",
} as const;

export function getTrafficModal(telraamMatch: TelraamMatch) {
	const p = telraamMatch.originalProperties;
	/* Inner → outer: Fußgänger:innen, Fahrräder, Autos, LKW (tilt in chart follows this index order). */
	return [
		{
			name: i18n("trafficStats.pedestrians"),
			count: parseFloat(p.pedestrian.toFixed(0)),
			percentage: parseFloat(p.pedestrian_percentage.toFixed(0)),
			color: trafficColors.blue,
		},
		{
			name: i18n("trafficStats.bikes"),
			count: parseFloat(p.bike.toFixed(0)),
			percentage: parseFloat(p.bike_percentage.toFixed(0)),
			color: trafficColors.yellow,
		},
		{
			name: i18n("trafficStats.cars"),
			count: parseFloat(p.car.toFixed(0)),
			percentage: parseFloat(p.car_percentage.toFixed(0)),
			color: trafficColors.red,
		},
		{
			name: i18n("trafficStats.trucks"),
			count: parseFloat(p.heavy.toFixed(0)),
			percentage: parseFloat(p.heavy_percentage.toFixed(0)),
			color: trafficColors.orange,
		},
	];
}

/**
 * Dominant mode (independent of `getTrafficModal` ring order):
 * 0 Fuß, 1 Fahrrad, 2 Auto, 3 LKW.
 */
export function getDominantTrafficModalIndex(
	telraamMatch: TelraamMatch,
): number {
	const p = telraamMatch.originalProperties;
	const candidates: { pct: number; semantic: number }[] = [
		{ pct: p.pedestrian_percentage, semantic: 0 },
		{ pct: p.bike_percentage, semantic: 1 },
		{ pct: p.car_percentage, semantic: 2 },
		{ pct: p.heavy_percentage, semantic: 3 },
	];

	let best = candidates[0];
	for (let i = 1; i < candidates.length; i += 1) {
		if (candidates[i].pct > best.pct) {
			best = candidates[i];
		}
	}

	return best.semantic;
}

/**
 * Maps the dominant traffic modal segment to a Tailwind gradient background.
 * Keeps the "gradient" feel while reflecting the dominant category.
 */
export function getDominantTrafficGradientClass(dominantIndex: number): string {
	switch (dominantIndex) {
		// pedestrians
		case 0:
			return "bg-gradient-to-b from-bp-blue to-white";
		// bikes
		case 1:
			return "bg-gradient-to-b from-bp-yellow to-white";
		// cars
		case 2:
			return "bg-gradient-to-b from-bp-red to-white";
		// trucks
		case 3:
			return "bg-gradient-to-b from-bp-orange to-white";
		default:
			return "bg-gradient-to-b from-bp-red to-white";
	}
}

/** CSS color for the gradient start color in `getDominantTrafficGradientClass` (matches `pageBackgroundClass` when a match is selected). */
export function getDominantTrafficGradientFromColor(
	dominantIndex: number,
): string {
	switch (dominantIndex) {
		case 0:
			return trafficColors.blue;
		case 1:
			return trafficColors.yellow;
		case 2:
			return trafficColors.red;
		case 3:
			return trafficColors.orange;
		default:
			return trafficColors.red;
	}
}

export function scaleForStackPosition(
	index: number, // 0 = back, stackSize - 1 = front
	size: number,
	minScale: number,
) {
	if (size <= 1) {
		return 1;
	}

	const progressTowardFront = index / (size - 1); // 0 → 1
	const maxScale = 1;
	return minScale + progressTowardFront * (maxScale - minScale);
}
