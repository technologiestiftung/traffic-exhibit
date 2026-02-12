import type { TelraamMatch } from "../../../../api/src/common";
import type { StackPositionStyles } from "./match-card";
import { MatchCard } from "./match-card";

export const MatchCards = ({
	matchStack,
	selectedIndex,
	handleSelect,
	streetViewTrigger,
}: {
	matchStack: TelraamMatch[];
	selectedIndex: number;
	handleSelect: (index: number) => void;
	streetViewTrigger?: number;
}) => {
	return matchStack.map((match, index) => {
		const stackLength = matchStack.length;
		const isSelectedCard = index === selectedIndex;

		// We want a stable 3-slot layout:
		// slot 1 = left/back, slot 2 = middle, slot 3 = right/front (selected)
		// This gives a "cards" feel while keeping the overall layout stable.
		const baseX = -40;
		const slotX = [-160 + baseX, -60 + baseX, 60 + baseX] as const;
		const slotRotate = [-10, -4, 0] as const;
		const slotScale = [0.92, 0.97, 1.02] as const;
		const slotZ = [1, 2, 4] as const;

		let slotIndex = 1; // default to middle
		if (stackLength >= 3) {
			if (isSelectedCard) {
				slotIndex = 2;
			} else {
				// For the two non-selected cards, keep deterministic ordering.
				// Put the lower original index into slot 1, the higher into slot 2.
				const others = [0, 1, 2].filter((i) => i !== selectedIndex);
				slotIndex = index === Math.min(...others) ? 0 : 1;
			}
		}

		const zIndex = isSelectedCard ? stackLength + 1 : slotZ[slotIndex];
		const scale = slotScale[slotIndex];
		const leftOffset = 0;
		const transformStyle = `translateX(${slotX[slotIndex]}px) rotate(${slotRotate[slotIndex]}deg) scale(${scale})`;

		const stackPosition: StackPositionStyles = {
			zIndex,
			scale,
			transformStyle,
			leftOffset,
		};

		return (
			<MatchCard
				key={match.segment_id ?? index}
				match={match}
				index={index}
				stackPosition={stackPosition}
				selected={isSelectedCard}
				onSelect={handleSelect}
				transitionToStreetViewTrigger={streetViewTrigger}
			/>
		);
	});
};
