import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import {
	IDLE_BEFORE_RETURN_TO_START_MS,
	useScreenStore,
} from "../stores/useScreenStore";
import type {
	TelraamMatch,
	TelraamMatchesPayload,
} from "../../../api/src/common";

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
	const [noCloseMatch, setNoCloseMatch] = useState(false);
	const selectionButtonCallbackRef = useRef<
		((data: SelectionButtonData) => void) | null
	>(null);
	const selectionButtonPressedCallbackRef = useRef<(() => void) | null>(null);

	const { setStartStopButton } = useScreenStore();

	useEffect(() => {
		const onInteract = () => {
			useScreenStore.getState().recordInteraction();
		};
		window.addEventListener("pointerdown", onInteract, { passive: true });
		window.addEventListener("touchstart", onInteract, { passive: true });
		return () => {
			window.removeEventListener("pointerdown", onInteract);
			window.removeEventListener("touchstart", onInteract);
		};
	}, []);

	useEffect(() => {
		const newSocket = io(wsUrl);
		setSocket(newSocket);

		newSocket.on("camera-data", (data: number[]) => {
			setOccupiedBlocks(data);
		});

		newSocket.on("telraam-matches", (data: TelraamMatchesPayload) => {
			setTelraamMatches(data.matches as TelraamMatch[]);
			setNoCloseMatch(data.noCloseMatch);
		});

		// Handle start event from start button (clockwise rotation)
		newSocket.on("start-event", () => {
			useScreenStore.getState().recordInteraction();
			setStartStopButton();
			// eslint-disable-next-line no-console
			console.log("start event received from start button");
		});

		// Handle stop event from start button (counter-clockwise rotation)
		newSocket.on("stop-event", () => {
			useScreenStore.getState().recordInteraction();
			setStartStopButton();
			// eslint-disable-next-line no-console
			console.log("stop event received from start button");
		});

		newSocket.on("motor-session-complete", () => {
			useScreenStore.getState().setPendingIdleReturnToStart(true);
		});

		// Handle selection button rotation from backend
		newSocket.on("selection_button_rotated", (data: SelectionButtonData) => {
			useScreenStore.getState().recordInteraction();
			if (selectionButtonCallbackRef.current) {
				selectionButtonCallbackRef.current(data);
			}
		});

		// Handle selection button push (SW) - triggers tiny planet → street view
		newSocket.on("selection_button_pressed", () => {
			useScreenStore.getState().recordInteraction();
			if (selectionButtonPressedCallbackRef.current) {
				selectionButtonPressedCallbackRef.current();
			}
		});

		return () => {
			newSocket.disconnect();
		};
	}, [setStartStopButton]);

	useEffect(() => {
		if (!socket) {
			return undefined;
		}
		const id = setInterval(() => {
			const state = useScreenStore.getState();
			if (!state.pendingIdleReturnToStart || state.currentScreen === "start") {
				return;
			}
			if (
				Date.now() - state.lastInteractionAt >=
				IDLE_BEFORE_RETURN_TO_START_MS
			) {
				state.applyIdleReturnToStart();
				socket.emit("go-back-to-start");
			}
		}, 1000);
		return () => clearInterval(id);
	}, [socket]);

	const goBackToStart = () => {
		useScreenStore.getState().applyIdleReturnToStart();
		socket?.emit("go-back-to-start");
	};

	const onSelectionButtonRotated = (
		callback: (data: SelectionButtonData) => void,
	) => {
		selectionButtonCallbackRef.current = callback;
	};

	const onSelectionButtonPressed = (callback: () => void) => {
		selectionButtonPressedCallbackRef.current = callback;
	};

	return {
		occupiedBlocks,
		goBackToStart,
		telraamMatches,
		noCloseMatch,
		onSelectionButtonRotated,
		onSelectionButtonPressed,
	};
};
