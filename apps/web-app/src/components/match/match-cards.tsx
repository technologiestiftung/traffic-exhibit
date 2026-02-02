import type { TelraamMatch } from "../../../../api/src/common";
import type { StackPositionStyles } from "./match-card";
import { MatchCard } from "./match-card";

export const MatchCards = ({
	matchStack,
	selectedIndex,
	handleSelect,
}: {
	matchStack: TelraamMatch[];
	selectedIndex: number;
	handleSelect: (index: number) => void;
}) => {
	return matchStack.map((match, index) => {
		const stackLength = matchStack.length;
		const isSelectedCard = index === selectedIndex;
		const leftOffset = -50 * index;

		// Custom z-index logic: index 1 always in middle unless selected
		let zIndex: number;
		if (isSelectedCard) {
			zIndex = stackLength + 1; // Selected card always on top
		} else if (index === 1) {
			zIndex = 2; // Middle card always at z-index 2
		} else if (index === 0) {
			zIndex = selectedIndex === 2 ? 1 : 3; // First card: low when third is selected, high otherwise
		} else if (index === 2) {
			zIndex = selectedIndex === 0 ? 1 : 3; // Third card: low when first is selected, high otherwise
		} else {
			zIndex = stackLength - index; // Fallback for more than 3 cards
		}

		const scale = isSelectedCard ? 1.02 : 0.95;
		const transformStyle = `scale(${scale})`;

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
			/>
		);
	});
};
