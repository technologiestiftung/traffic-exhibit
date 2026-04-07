import dotenv from "dotenv";
dotenv.config();
import { logger } from "./logger";

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { findClosestMatches } from "./data-processing/find-modal-split-match";
import telraamDataRaw from "./../data/telraam-data.json";
import enrichedTelraamDataRaw from "./../data/enriched-telraam-data.json";
import type {
	TrafficFeature,
	TelraamMatch,
	TelraamMatchesPayload,
} from "./common";

const telraamData = telraamDataRaw as { features: TrafficFeature[] };
const enrichedTelraamData = enrichedTelraamDataRaw as TelraamMatch[];

// Segment IDs that have an image (skip matches without images in favour of next closest)
const segmentIdsWithImage = new Set(
	enrichedTelraamData
		.filter((e) => e.imageURL !== null && e.imageURL !== "")
		.map((e) => e.segment_id),
);

// Store current detection data (default to example values)
let currentDetections = { car: 40, bike: 40, pedestrian: 10, heavy: 10 };

// Calculate initial matches (only features that have images)
let closestMatchesResult = findClosestMatches(
	currentDetections,
	telraamData.features,
	segmentIdsWithImage,
);

// for each match the closest result with enriched-telraam-data
let enrichedMatches =
	closestMatchesResult.matches?.map((match) =>
		enrichedTelraamData.find(
			(feature) =>
				feature.originalProperties.segment_id === match.properties.segment_id,
		),
	) || [];

let telraamMatchesPayload: TelraamMatchesPayload = {
	matches: enrichedMatches,
	noCloseMatch: closestMatchesResult.noCloseMatch,
};

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Serve static files from the data directory
app.use("/data", express.static(path.join(__dirname, "../data")));

// API endpoint to receive YOLO detection data
app.post("/api/detections", (req, res) => {
	try {
		const { percentages } = req.body;

		if (!percentages || typeof percentages !== "object") {
			return res
				.status(400)
				.json({ error: "Invalid request: percentages required" });
		}

		// Update current detections with new data
		currentDetections = {
			car: percentages.car || 0,
			bike: percentages.bike || 0,
			pedestrian: percentages.pedestrian || 0,
			heavy: percentages.heavy || 0,
		};

		logger.info("Received detection data:", currentDetections);

		// Recalculate matches with new detection data (only features that have images)
		closestMatchesResult = findClosestMatches(
			currentDetections,
			telraamData.features,
			segmentIdsWithImage,
		);

		// Update enriched matches
		enrichedMatches =
			closestMatchesResult.matches?.map((match) =>
				enrichedTelraamData.find(
					(feature) =>
						feature.originalProperties.segment_id ===
						match.properties.segment_id,
				),
			) || [];

		telraamMatchesPayload = {
			matches: enrichedMatches,
			noCloseMatch: closestMatchesResult.noCloseMatch,
		};

		// Broadcast updated matches to all connected clients
		io.emit("telraam-matches", telraamMatchesPayload);
		io.emit("detection-update", currentDetections);

		return res.json({ success: true, detections: currentDetections });
	} catch (error) {
		logger.error("Error processing detection data:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

// --- socket/http (kept in this file, as requested) ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: "*",
	},
});

io.on("connection", (socket) => {
	logger.success("Frontend connected");

	// Handle start event from start button (clockwise rotation)
	socket.on("start-event", () => {
		logger.info("Start event received from start button");
		// Forward to all connected frontend clients
		io.emit("start-event");
	});

	// Handle stop event from start button (counter-clockwise rotation)
	socket.on("stop-event", () => {
		logger.info("Stop event received from start button");
		// Forward to all connected frontend clients
		io.emit("stop-event");
	});

	// Natural end of timed motor run (e.g. 5 min) from button_monitor.py
	socket.on("motor-session-complete", () => {
		logger.info("Motor session completed (timed run finished)");
		io.emit("motor-session-complete");
	});

	// Handle selection button rotation from Python script
	socket.on("selection_button_rotated", (data) => {
		io.emit("selection_button_rotated", data);
	});

	// Handle selection button push (SW) from Python script - triggers tiny planet → street view
	socket.on("selection_button_pressed", () => {
		io.emit("selection_button_pressed");
	});

	socket.emit("telraam-matches", telraamMatchesPayload);

	/*
	 * TO DO: Handle "go-back-to-start" event from frontend
	 * 1. stop rotating disc
	 * 2. start scan for checked for filled blocks
	 * 3. run object recognition for modal split
	 * (4. optional: turn light off or to red)
	 */
	socket.on("go-back-to-start", async () => {
		logger.info("Motor stopped via Python script");
	});
});

httpServer.listen(3001, () => {
	logger.success("Backend running on -> http://localhost:3001");
});
