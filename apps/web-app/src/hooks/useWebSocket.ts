import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";
import { useScreenStore } from "../stores/useScreenStore";
import type {
	TelraamMatch,
	ObjectDetectionResult,
} from "../../../api/src/common";

const wsUrl = import.meta.env.VITE_WS_URL;

export const useWebSocket = () => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [occupiedBlocks, setOccupiedBlocks] = useState<number[]>([]);
	const [telraamMatches, setTelraamMatches] = useState<TelraamMatch[]>([]);
	const [objectDetection, setObjectDetection] =
		useState<ObjectDetectionResult | null>(null);

	const { setCurrentScreen, setStartStopButton } = useScreenStore();

	useEffect(() => {
		const newSocket = io(wsUrl);
		setSocket(newSocket);

		newSocket.on("camera-data", (data: number[]) => {
			setOccupiedBlocks(data);
		});

		newSocket.on("telraam-matches", (data: TelraamMatch[]) => {
			setTelraamMatches(data);
		});

		newSocket.on("object_detection_result", (data: ObjectDetectionResult) => {
			setObjectDetection(data);
			// eslint-disable-next-line no-console
			console.log("object detection", data);
		});

		// Handle button press from backend
		newSocket.on("start_stop_button_pressed", () => {
			setStartStopButton();
			// eslint-disable-next-line no-console
			console.log("pressed start/stop button");
		});

		return () => {
			newSocket.disconnect();
		};
	}, []);

	const goBackToStart = () => {
		setCurrentScreen("start");
		socket?.emit("go-back-to-start");
	};

	return { occupiedBlocks, goBackToStart, telraamMatches, objectDetection };
};
