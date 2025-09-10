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

	// Simulate camera data
	setInterval(() => {
		const numbers = Array.from({ length: 10 }, () =>
			Math.floor(Math.random() * 100),
		);
		socket.emit("camera-data", numbers);
	}, 2000);

	// Handle stop motor command
	socket.on("stop-motor", async () => {
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
