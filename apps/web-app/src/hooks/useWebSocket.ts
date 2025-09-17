import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";
import { useScreenStore } from "../stores/useScreenStore";

const wsUrl = import.meta.env.VITE_WS_URL;

export const useWebSocket = () => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [occupiedBlocks, setOccupiedBlocks] = useState<number[]>([]);
	const [telraamMatch, setTelraamMatch] = useState(null);

	const { setCurrentScreen } = useScreenStore();

	useEffect(() => {
		const newSocket = io(wsUrl);
		setSocket(newSocket);
		newSocket.on("camera-data", (data: number[]) => {
			setOccupiedBlocks(data);
		});
		newSocket.on("telraam-match", (data) => {
			setTelraamMatch(data);
		});
		return () => {
			newSocket.disconnect();
		};
	}, []);

	const goBackToStart = () => {
		setCurrentScreen("start");
		socket?.emit("go-back-to-start");
	};

	return { occupiedBlocks, goBackToStart, telraamMatch };
};
