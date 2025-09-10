import { create } from "zustand";

interface ScreenState {
	currentScreen: "start" | "loading" | "match";
	setCurrentScreen: (screen: ScreenState["currentScreen"]) => void;
	setLoadingScreen: () => void;
}

export const useScreenStore = create<ScreenState>((set) => ({
	currentScreen: "start",
	setCurrentScreen: (screen) => set({ currentScreen: screen }),

	// only for demo purposes
	setLoadingScreen: () => {
		set({ currentScreen: "loading" });
		setTimeout(() => {
			set({ currentScreen: "match" });
		}, 2500);
	},
}));
