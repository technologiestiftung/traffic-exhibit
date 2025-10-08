import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { runPythonScript, startButtonMonitoring as startButtonScript } from "./runPythonScripts";
import { findClosestMatch } from "./data-processing/find-modal-split-match";
import telraamDataRaw from "./../data/telraam-data-snippet.json";
import enrichedTelraamDataRaw from "./../data/enriched-telraam-data.json";
import type { TrafficFeature } from "./common";
import type { ChildProcess } from "child_process";

const telraamData = telraamDataRaw as { features: TrafficFeature[] };
const enrichedTelraamData = enrichedTelraamDataRaw as any[];

const closestMatch = findClosestMatch(
	{ car: 50, bike: 30, pedestrian: 15, heavy: 5 },
	telraamData.features,
);

// match the closest result with enriched-telraam-data
const enrichedMatch =
	enrichedTelraamData.find(
		(feature: any) =>
			feature.originalProperties.segment_id ===
			closestMatch?.properties.segment_id,
	) || null;

const app = express();

// --- socket/http (kept in this file, as requested) ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: "*",
	},
});

// Global state for button monitoring
let isMoving = false;
let buttonMonitoringProcess: ChildProcess | null = null;

// Start button monitoring
const startButtonMonitoring = () => {
	buttonMonitoringProcess = startButtonScript(
		"./scripts/start_stop_button.py",
		(newIsMoving: boolean) => {
			// Only emit if the state actually changed
			if (isMoving !== newIsMoving) {
				isMoving = newIsMoving;
				// Broadcast state change to all connected clients
				io.emit("movement-state-changed", { is_moving: isMoving });
				console.log(`Movement state changed to: ${isMoving ? 'moving' : 'stopped'}`);
			}
		},
		(error: Error) => {
			console.error("Button monitoring error:", error);
			// Restart monitoring after a delay
			setTimeout(startButtonMonitoring, 5000);
		}
	);
};

// Start button monitoring when server starts
startButtonMonitoring();

io.on("connection", (socket) => {
	// eslint-disable-next-line no-console
	console.log("Frontend connected");

	// Send current movement state to newly connected client
	socket.emit("movement-state-changed", { is_moving: isMoving });

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

	socket.emit("telraam-match", enrichedMatch);

	/*
	 * TO DO: Handle "go-back-to-start" event from frontend
	 * 1. stop rotating disc
	 * 2. start scan for checked for filled blocks
	 * 3. run object recognition for modal split
	 * (4. optional: turn light off or to red)
	 */
	socket.on("go-back-to-start", async () => {
		try {
			await runPythonScript("./scripts/control_motor.py");
			// eslint-disable-next-line no-console
			console.log("Motor stopped via Python script");
		} catch (err) {
			console.error("Failed to stop motor:", err);
		}
	});
});

httpServer.listen(3001, () => {
	// eslint-disable-next-line no-console
	console.log("Backend running on http://localhost:3001");
});

// Cleanup on server shutdown
process.on('SIGINT', () => {
	console.log('\nShutting down server...');
	if (buttonMonitoringProcess) {
		buttonMonitoringProcess.kill();
	}
	process.exit(0);
});

process.on('SIGTERM', () => {
	console.log('\nShutting down server...');
	if (buttonMonitoringProcess) {
		buttonMonitoringProcess.kill();
	}
	process.exit(0);
});
