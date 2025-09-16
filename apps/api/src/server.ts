import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { runPythonScript } from "./runPythonScripts";
import { handleNoiseRequest } from "./data-preparation/noise-service";
import { findWorstIndexForCoordinate } from "./data-preparation/air-quality-service";
import { checkBikeLaneOverlap } from "./data-preparation/bike-lane-service";

const app = express();
app.use(express.json()); // for JSON POST bodies

// --- routes ---
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/noise", handleNoiseRequest);

// --- socket/http (kept in this file, as requested) ---
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: "*",
	},
});

// Test the air quality function and log the result
try {
	const worstIndex = findWorstIndexForCoordinate(
		13.441177599882215,
		52.528336599682355,
	);
	// eslint-disable-next-line no-console
	console.log(
		`Air quality worst index for coordinates (13.384831794, 52.484664728): ${worstIndex}`,
	);
} catch (error) {
	console.error("Error calling findWorstIndexForCoordinate:", error);
}

// Test the bike lane overlap function
async function testBikeLaneOverlap() {
	try {
		const coordinates = [
			{ lon: 13.381331328675396, lat: 52.489793757305165 },
			{ lon: 13.382287106334381, lat: 52.48989928205013 },
		];

		// 	{ lon: 13.387929865667388, lat: 52.483641481858655 },
		// 	{ lon: 13.388140899999883, lat: 52.48398972106418 },
		// 	{ lon: 13.388161322677405, lat: 52.48430271942601 }
		// Platz d. Luftbrücke

		// { lon: 13.381331328675396, lat: 52.489793757305165 },
		// { lon: 13.382287106334381, lat: 52.48989928205013 },
		// Kreuzbergstr.

		//  { lon: 13.40680172677554, lat: 52.53577669525484 },
		// 	{ lon: 13.409654935660228, lat: 52.53854107631082 },
		// Kastanienallee

		const { overlappingLaneTypes } = await checkBikeLaneOverlap(coordinates);

		// eslint-disable-next-line no-console
		console.log(`Bike lane overlap result:`, overlappingLaneTypes);
	} catch (error) {
		console.error("Error calling checkBikeLaneOverlap:", error);
	}
}

// Call the test function
testBikeLaneOverlap();

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
