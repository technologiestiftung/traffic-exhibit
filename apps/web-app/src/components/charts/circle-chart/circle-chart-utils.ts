export type CircleChartSegment = {
	name: string;
	count: number;
	percentage: number;
	color: string;
	labelOffset?: string;
};

type ComputedSegment = {
	name: string;
	count: number;
	percentage: number;
	color: string;
	labelOffset?: string;
	radius: number;
	strokeWidth: number;
	labelRadius: number;
	key: string;
};

export const buildSegments = ({
	data,
	minRadius,
	maxRadius,
	gap,
}: {
	data: CircleChartSegment[];
	minRadius: number;
	maxRadius: number;
	gap: number;
}): ComputedSegment[] => {
	const totalValue = data.reduce((sum, segment) => sum + segment.percentage, 0);
	const totalGap = gap * data.length;
	const availableSpan = Math.max(maxRadius - minRadius - totalGap, 0);
	const scale = totalValue > 0 ? availableSpan / totalValue : 0;

	let currentInnerRadius = minRadius;

	return data.map((segment, index) => {
		const strokeWidth = segment.percentage * scale;
		const radius = currentInnerRadius + strokeWidth / 1.75;
		const labelRadius = currentInnerRadius + strokeWidth + gap / 2;

		currentInnerRadius += strokeWidth + gap;

		return {
			...segment,
			radius,
			strokeWidth,
			labelRadius,
			key: `${segment.name}-${index}`,
		};
	});
};

export const lightenColor = (color: string, intensity = 0.5): string => {
	// Handle CSS variables by resolving them first
	let hex = color;
	if (color.startsWith("var(")) {
		// Extract variable name from var(--variable-name)
		const varName = color.match(/var\((--[^)]+)\)/)?.[1];
		if (varName && typeof document !== "undefined") {
			// Resolve the CSS variable from the document root
			const resolvedColor = getComputedStyle(
				document.documentElement,
			).getPropertyValue(varName);
			hex = resolvedColor.trim();
		}
	}

	const normalizedHex = hex.replace("#", "");
	const value =
		normalizedHex.length === 3
			? normalizedHex
					.split("")
					.map((char) => char + char)
					.join("")
			: normalizedHex;

	const num = parseInt(value, 16);
	const r = (num >> 16) & 255;
	const g = (num >> 8) & 255;
	const b = num & 255;

	const mix = (channel: number) =>
		Math.round(channel + (255 - channel) * intensity);

	const newR = mix(r);
	const newG = mix(g);
	const newB = mix(b);

	const toHex = (channel: number) => channel.toString(16).padStart(2, "0");

	return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};
