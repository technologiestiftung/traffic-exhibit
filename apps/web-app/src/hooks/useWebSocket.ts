import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";
import { useScreenStore } from "../stores/useScreenStore";
import type { TelraamMatch } from "../../../api/src/common";

const wsUrl = import.meta.env.VITE_WS_URL;

type RotaryEncoder2Data = {
	direction: "clockwise" | "counter-clockwise";
	position: number;
	pulseCount: number;
};

export const useWebSocket = () => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [occupiedBlocks, setOccupiedBlocks] = useState<number[]>([]);
	const [telraamMatches, setTelraamMatches] = useState<TelraamMatch[]>([]);
	const [rotaryEncoder2Callback, setRotaryEncoder2Callback] = useState<
		((data: RotaryEncoder2Data) => void) | null
	>(null);

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

		// Handle button press from backend
		newSocket.on("start_stop_button_pressed", () => {
			setStartStopButton();
			// eslint-disable-next-line no-console
			console.log("pressed start/stop button");
		});

		// Handle second rotary encoder rotation from backend
		newSocket.on("rotary_encoder2_rotated", (data: RotaryEncoder2Data) => {
			if (rotaryEncoder2Callback) {
				rotaryEncoder2Callback(data);
			}
		});

		return () => {
			newSocket.disconnect();
		};
	}, [rotaryEncoder2Callback]);

	const goBackToStart = () => {
		setCurrentScreen("start");
		socket?.emit("go-back-to-start");
	};

	const onRotaryEncoder2Rotated = (
		callback: (data: RotaryEncoder2Data) => void,
	) => {
		setRotaryEncoder2Callback(() => callback);
	};

	return {
		occupiedBlocks,
		goBackToStart,
		telraamMatches,
		onRotaryEncoder2Rotated,
	};
};
