// New coordinate format: [longitude, latitude]
export type Coordinates = [longitude: number, latitude: number];

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

// Types for modal split calculations
export type ModalSplitData = {
	car: number;
	bike: number;
	pedestrian: number;
	heavy: number;
};

export type ModalSplitPercentages = {
	car: number;
	bike: number;
	pedestrian: number;
	heavy: number;
};

// Types for Telraam/traffic data feature
export type TrafficFeature = {
	type: "Feature";
	geometry: {
		type: string;
		coordinates: number[][] | number[][][];
	};
	properties: {
		segment_id: number;
		last_data_package: string;
		timezone: string;
		date: string;
		period: string;
		uptime: number;
		heavy: number;
		car: number;
		bike: number;
		pedestrian: number;
		night: string;
		car_percentage: number;
		bike_percentage: number;
		pedestrian_percentage: number;
		heavy_percentage: number;
		[key: string]: unknown;
	};
};

// Type for enriched telraam match data
export type TelraamMatch = {
	segment_id: number;
	coordinates: number[][];
	airQuality: number;
	imageURL: string;
	imageIsPano?: boolean | null;
	bikeLaneTypes: string[];
	nearestNoiseLevel: number | null;
	address: string;
	district: string;
	originalProperties: TrafficFeature["properties"];
	active?: boolean;
};

export type TelraamMatchesPayload = {
	matches: Array<TelraamMatch | undefined>;
};
