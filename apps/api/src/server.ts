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
import type { TrafficFeature, TelraamMatch } from "./common";

const telraamData = telraamDataRaw as { features: TrafficFeature[] };
const enrichedTelraamData = enrichedTelraamDataRaw as TelraamMatch[];

// Store current detection data (default to example values)
let currentDetections = { car: 40, bike: 50, pedestrian: 8, heavy: 15 };

// Calculate initial matches
let closestMatch = findClosestMatches(currentDetections, telraamData.features);

// for each match the closest result with enriched-telraam-data
let enrichedMatches =
	closestMatch?.map((match) =>
		enrichedTelraamData.find(
			(feature) =>
				feature.originalProperties.segment_id === match.properties.segment_id,
		),
	) || [];

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

		// Recalculate matches with new detection data
		closestMatch = findClosestMatches(currentDetections, telraamData.features);

		// Update enriched matches
		enrichedMatches =
			closestMatch?.map((match) =>
				enrichedTelraamData.find(
					(feature) =>
						feature.originalProperties.segment_id ===
						match.properties.segment_id,
				),
			) || [];

		// Broadcast updated matches to all connected clients
		io.emit("telraam-matches", enrichedMatches);
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

	// Handle selection button rotation from Python script
	socket.on("selection_button_rotated", (data) => {
		logger.info("Selection button rotated", data);
		// Forward to all connected frontend clients
		io.emit("selection_button_rotated", data);
	});

	socket.emit("telraam-matches", enrichedMatches);

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
