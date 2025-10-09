import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";
import { useScreenStore } from "../stores/useScreenStore";
import type { TelraamMatch } from "../../../api/src/common";

const wsUrl = import.meta.env.VITE_WS_URL;

export const useWebSocket = () => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [occupiedBlocks, setOccupiedBlocks] = useState<number[]>([]);
	const [telraamMatch, setTelraamMatch] = useState<TelraamMatch | null>(null);
	const [isMoving, setIsMoving] = useState<boolean>(false);

	const { setCurrentScreen, setLoadingScreen } = useScreenStore();

	useEffect(() => {
		const newSocket = io(wsUrl);
		setSocket(newSocket);

		newSocket.on("camera-data", (data: number[]) => {
			setOccupiedBlocks(data);
		});

		newSocket.on("telraam-match", (data: TelraamMatch) => {
			setTelraamMatch(data);
		});

		newSocket.on("movement-state-changed", (data: { is_moving: boolean }) => {
			setIsMoving(data.is_moving);
			if (data.is_moving) setLoadingScreen();
			console.log(
				"Received movement-state-changed:",
				data.is_moving ? "moving" : "stopped",
			);
		});

		console.log("useEffect triggered - setting up WebSocket");

		return () => {
			newSocket.disconnect();
		};
	}, []);

	const goBackToStart = () => {
		setCurrentScreen("start");
		socket?.emit("go-back-to-start");
	};

	return { occupiedBlocks, goBackToStart, telraamMatch, isMoving };
};
