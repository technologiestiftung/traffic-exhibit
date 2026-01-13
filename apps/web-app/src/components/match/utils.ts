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

export function getTrafficModal(telraamMatch: TelraamMatch) {
	return [
		{
			name: i18n("trafficStats.pedestrians"),
			count: parseFloat(telraamMatch?.originalProperties.pedestrian.toFixed(0)),
			percentage: parseFloat(
				telraamMatch?.originalProperties.pedestrian_percentage.toFixed(0),
			),
			color: "#e7fe64",
			labelOffset: "15%",
		},
		{
			name: i18n("trafficStats.bikes"),
			count: parseFloat(telraamMatch?.originalProperties.bike.toFixed(0)),
			percentage: parseFloat(
				telraamMatch?.originalProperties.bike_percentage.toFixed(0),
			),
			color: "#00a980",
			labelOffset: "25%",
		},
		{
			name: i18n("trafficStats.cars"),
			count: parseFloat(telraamMatch?.originalProperties.car.toFixed(0)),
			percentage: parseFloat(
				telraamMatch?.originalProperties.car_percentage.toFixed(0),
			),
			color: "#e98cbd",
			labelOffset: "30%",
		},
		{
			name: i18n("trafficStats.trucks"),
			count: parseFloat(telraamMatch?.originalProperties.heavy.toFixed(0)),
			percentage: parseFloat(
				telraamMatch?.originalProperties.heavy_percentage.toFixed(0),
			),
			color: "#3360e9",
			labelOffset: "35%",
		},
	];
}

export function getDominantTrafficModalIndex(
	telraamMatch: TelraamMatch,
): number {
	const modal = getTrafficModal(telraamMatch);
	if (!modal.length) {
		return 0;
	}

	let maxIndex = 0;
	for (let i = 1; i < modal.length; i += 1) {
		if (modal[i].percentage > modal[maxIndex].percentage) {
			maxIndex = i;
		}
	}

	return maxIndex;
}

/**
 * Maps the dominant traffic modal segment to a Tailwind gradient background.
 * Keeps the "gradient" feel while reflecting the dominant category.
 */
export function getDominantTrafficGradientClass(dominantIndex: number): string {
	switch (dominantIndex) {
		// pedestrians
		case 0:
			return "bg-gradient-to-b from-[#E7FE64] to-white";
		// bikes
		case 1:
			return "bg-gradient-to-b from-[#00a980] to-white";
		// cars
		case 2:
			return "bg-gradient-to-b from-[#e98cbd] to-white";
		// trucks
		case 3:
			return "bg-gradient-to-b from-[#3360e9] to-white";
		default:
			return "bg-gradient-to-b from-[#E7FE64] to-white";
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
