import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { useScreenStore } from "../stores/useScreenStore";
import type { TelraamMatch } from "../../../api/src/common";

const wsUrl = import.meta.env.VITE_WS_URL;

type SelectionButtonData = {
	direction: "clockwise" | "counter-clockwise";
	position: number;
	pulseCount: number;
};

export const useWebSocket = () => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [occupiedBlocks, setOccupiedBlocks] = useState<number[]>([]);
	const [telraamMatches, setTelraamMatches] = useState<TelraamMatch[]>([]);
	const selectionButtonCallbackRef = useRef<
		((data: SelectionButtonData) => void) | null
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

		// Handle start event from start button (clockwise rotation)
		newSocket.on("start-event", () => {
			setStartStopButton();
			// eslint-disable-next-line no-console
			console.log("start event received from start button");
		});

		// Handle stop event from start button (counter-clockwise rotation)
		newSocket.on("stop-event", () => {
			setStartStopButton();
			// eslint-disable-next-line no-console
			console.log("stop event received from start button");
		});

		// Handle selection button rotation from backend
		newSocket.on("selection_button_rotated", (data: SelectionButtonData) => {
			// eslint-disable-next-line no-console
			console.log("selection_button_rotated signal received:", data);
			if (selectionButtonCallbackRef.current) {
				selectionButtonCallbackRef.current(data);
			}
		});

		return () => {
			newSocket.disconnect();
		};
	}, [setStartStopButton]);

	const goBackToStart = () => {
		setCurrentScreen("start");
		socket?.emit("go-back-to-start");
	};

	const onSelectionButtonRotated = (
		callback: (data: SelectionButtonData) => void,
	) => {
		selectionButtonCallbackRef.current = callback;
	};

	return {
		occupiedBlocks,
		goBackToStart,
		telraamMatches,
		onSelectionButtonRotated,
	};
};
