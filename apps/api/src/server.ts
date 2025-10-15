import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { findClosestMatches } from "./data-processing/find-modal-split-match";
import telraamDataRaw from "./../data/telraam-data.json";
import enrichedTelraamDataRaw from "./../data/enriched-telraam-data.json";
import type { TrafficFeature, TelraamMatch } from "./common";

const telraamData = telraamDataRaw as { features: TrafficFeature[] };
const enrichedTelraamData = enrichedTelraamDataRaw as TelraamMatch[];

const closestMatch = findClosestMatches(
	{ car: 70, bike: 10, pedestrian: 4, heavy: 12 },
	telraamData.features,
);

// for each match the closest result with enriched-telraam-data
const enrichedMatches =
	closestMatch?.map((match) =>
		enrichedTelraamData.find(
			(feature) =>
				feature.originalProperties.segment_id === match.properties.segment_id,
		),
	) || [];

const app = express();

// --- socket/http (kept in this file, as requested) ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: "*",
	},
});

io.on("connection", (socket) => {
	// eslint-disable-next-line no-console
	console.log("Frontend connected");

	/* OPTIONAL
	 * TO DO: get filled block positions from camera
	 * 1. run new python script to get filled block positions
	 * 2. send filled block positions to frontend
	 */
	setInterval(() => {
		const count = Math.floor(Math.random() * 10) + 1;
		const numbers = Array.from({ length: 10 }, (_, i) => i + 1)
			.sort(() => Math.random() - 0.5)
			.slice(0, count);
		socket.emit("camera-data", numbers);
	}, 4000);

	/*
	 * TO DO: Handle press start button
	 * 1. start rotating disc
	 * 2. turn light to green
	 * 3. save current modal split
	 * 4. fetch telraam data
	 * 5. find match between modal split and telraam data
	 * 6. send match to frontend
	 * 7. (optional: turn on audio mix for the match)
	 */
	// console.log("Frontend connected");

	// Handle button press from Python script
	socket.on("button_pressed", (data) => {
		console.log("Button pressed event received from Python");
		// Forward to all connected frontend clients
		io.emit("start_stop_button_pressed", {
			isStartStopPressed: data.isStartStopButtonPressed,
		});
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
		console.log("Motor stopped via Python script");
	});
});

httpServer.listen(3001, () => {
	// eslint-disable-next-line no-console
	console.log("Backend running on http://localhost:3001");
});
