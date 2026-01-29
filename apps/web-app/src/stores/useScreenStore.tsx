import { create } from "zustand";

interface ScreenState {
	currentScreen: "start" | "loading" | "match";
	setCurrentScreen: (screen: ScreenState["currentScreen"]) => void;
	setLoadingScreen: () => void;
	setStartStopButton: () => void;
	startStopButton: "start" | "stop";
}

export const useScreenStore = create<ScreenState>((set, get) => ({
	currentScreen: "start",
	setCurrentScreen: (screen) => set({ currentScreen: screen }),
	startStopButton: "start",

	// only for demo purposes
	setLoadingScreen: () => {
		set({ currentScreen: "loading" });
		setTimeout(() => {
			set({ currentScreen: "match" });
		}, 2500);
	},

	setStartStopButton: () => {
		if (get().startStopButton === "start") {
			set({ currentScreen: "loading", startStopButton: "stop" });
			setTimeout(() => {
				set({ currentScreen: "match" });
			}, 2500);
		} else {
			set({ currentScreen: "start", startStopButton: "start" });
		}
	},
}));
