import { create } from "zustand";

/** No button/screen interaction for this long → allow return to start after motor session ends. */
export const IDLE_BEFORE_RETURN_TO_START_MS = 1 * 60 * 1000;

interface ScreenState {
	currentScreen: "start" | "loading" | "match";
	setCurrentScreen: (screen: ScreenState["currentScreen"]) => void;
	setLoadingScreen: () => void;
	setStartStopButton: () => void;
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
	applyIdleReturnToStart: () =>
		set({
			currentScreen: "start",
			startStopButton: "start",
			pendingIdleReturnToStart: false,
		}),

	// only for demo purposes
	setLoadingScreen: () => {
		set({ currentScreen: "loading" });
		setTimeout(() => {
			set({ currentScreen: "match" });
		}, 10000);
	},

	setStartStopButton: () => {
		if (get().startStopButton === "start") {
			set({
				currentScreen: "loading",
				startStopButton: "stop",
				pendingIdleReturnToStart: false,
			});
			setTimeout(() => {
				set({ currentScreen: "match" });
			}, 10000);
		} else {
			set({
				currentScreen: "start",
				startStopButton: "start",
				pendingIdleReturnToStart: false,
			});
		}
	},
}));
