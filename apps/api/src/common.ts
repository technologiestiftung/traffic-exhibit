export type Coordinates = {
	lon: number;
	lat: number;
};

export type LineString = {
	type: "LineString";
	coordinates: number[][];
};

export type OverlapResult = {
	overlappingLaneTypes: string[];
	note?: string;
};

export type IntersectionFeature = {
	name: string;
	intersectionPercentage: number;
	laneType?: string; // Type of bike lane (ist_radvorrangnetz)
};

export type IntersectionResult = {
	intersectingFeatures: IntersectionFeature[];
};
