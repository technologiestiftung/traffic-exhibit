import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { runPythonScript } from "./runPythonScripts";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: "*",
	},
});

io.on("connection", (socket) => {
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
			console.log("Motor stopped via Python script");
		} catch (err) {
			console.error("Failed to stop motor:", err);
		}
	});
});

httpServer.listen(3001, () => {
	console.log("Backend running on http://localhost:3001");
});
