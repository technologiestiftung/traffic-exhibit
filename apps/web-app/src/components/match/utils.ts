import { parse, format } from "date-fns";
import { i18n } from "../../i18n/i18n-utils";
import type { TelraamMatch } from "../../../../api/src/common";

export const formatDdMmmYyyy = (value?: string) => {
	if (!value) {
		return "";
	}
	// matches: 2025-09-17 14:00:00+00:00
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
		},
		{
			name: i18n("trafficStats.bikes"),
			count: parseFloat(telraamMatch?.originalProperties.bike.toFixed(0)),
			percentage: parseFloat(
				telraamMatch?.originalProperties.bike_percentage.toFixed(0),
			),
		},
		{
			name: i18n("trafficStats.cars"),
			count: parseFloat(telraamMatch?.originalProperties.car.toFixed(0)),
			percentage: parseFloat(
				telraamMatch?.originalProperties.car_percentage.toFixed(0),
			),
		},
		{
			name: i18n("trafficStats.trucks"),
			count: parseFloat(telraamMatch?.originalProperties.heavy.toFixed(0)),
			percentage: parseFloat(
				telraamMatch?.originalProperties.heavy_percentage.toFixed(0),
			),
		},
	];
}

/**
 * Returns the scale for a card based on its position in the stack.
 * Back-most card gets MIN_SCALE, front-most gets 1.
 */
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
