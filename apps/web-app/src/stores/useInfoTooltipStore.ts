import { create } from "zustand";

interface InfoTooltipStore {
	openTooltipType: string | null;
	setOpenTooltipType: (type: string | null) => void;
	toggleTooltip: (type: string) => void;
	closeTooltip: () => void;
}

export const useInfoTooltipStore = create<InfoTooltipStore>((set) => ({
	openTooltipType: null,
	setOpenTooltipType: (type) => set({ openTooltipType: type }),
	toggleTooltip: (type) =>
		set((state) => ({
			openTooltipType: state.openTooltipType === type ? null : type,
		})),
	closeTooltip: () => set({ openTooltipType: null }),
}));
