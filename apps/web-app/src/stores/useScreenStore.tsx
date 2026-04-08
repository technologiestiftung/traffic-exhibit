import { create } from "zustand";

/** No button/screen interaction for this long → allow return to start after motor session ends. */
export const IDLE_BEFORE_RETURN_TO_START_MS = 1 * 60 * 1000;

const LOADING_TO_MATCH_MS = 5_000;

let loadingToMatchTimeout: ReturnType<typeof setTimeout> | null = null;

function clearLoadingToMatchTimeout() {
	if (loadingToMatchTimeout !== null) {
		clearTimeout(loadingToMatchTimeout);
		loadingToMatchTimeout = null;
	}
}

interface ScreenState {
	currentScreen: "start" | "loading" | "match";
	setCurrentScreen: (screen: ScreenState["currentScreen"]) => void;
	setLoadingScreen: () => void;
	/** Physical / socket start: loading → match; idempotent with current “active” UI. */
	applyStartEvent: () => void;
	/** Physical / socket stop: always start screen; clears pending loading→match timer. */
	applyStopEvent: () => void;
	startStopButton: "start" | "stop";
	/** Last pointer/touch or hardware button activity (ms since epoch). */
	lastInteractionAt: number;
	recordInteraction: () => void;
	/** After timed motor run ends, UI waits for idle before showing start. */
	pendingIdleReturnToStart: boolean;
	setPendingIdleReturnToStart: (pending: boolean) => void;
	applyIdleReturnToStart: () => void;
}

export const useScreenStore = create<ScreenState>((set, get) => ({
	currentScreen: "start",
	setCurrentScreen: (screen) => set({ currentScreen: screen }),
	startStopButton: "start",
	lastInteractionAt: Date.now(),
	recordInteraction: () => set({ lastInteractionAt: Date.now() }),
	pendingIdleReturnToStart: false,
	setPendingIdleReturnToStart: (pending) =>
		set({ pendingIdleReturnToStart: pending }),

	applyStartEvent: () => {
		clearLoadingToMatchTimeout();
		set({
			currentScreen: "loading",
			startStopButton: "stop",
			pendingIdleReturnToStart: false,
		});
		loadingToMatchTimeout = setTimeout(() => {
			useScreenStore.setState({ currentScreen: "match" });
			loadingToMatchTimeout = null;
		}, LOADING_TO_MATCH_MS);
	},

	applyStopEvent: () => {
		clearLoadingToMatchTimeout();
		set({
			currentScreen: "start",
			startStopButton: "start",
			pendingIdleReturnToStart: false,
		});
	},

	applyIdleReturnToStart: () => {
		clearLoadingToMatchTimeout();
		set({
			currentScreen: "start",
			startStopButton: "start",
			pendingIdleReturnToStart: false,
		});
	},

	// only for demo purposes
	setLoadingScreen: () => {
		get().applyStartEvent();
	},
}));
