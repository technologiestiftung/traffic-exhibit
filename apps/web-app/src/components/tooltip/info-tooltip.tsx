import React from "react";
import { useInfoTooltipStore } from "../../stores/useInfoTooltipStore";

type InfoTooltipProps = {
	type: string;
	content: string;
	children: React.ReactNode;
};

export const InfoTooltip: React.FC<InfoTooltipProps> = ({
	type,
	content,
	children,
}) => {
	const { openTooltipType, toggleTooltip } = useInfoTooltipStore();
	const isOpen = openTooltipType === type;

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (content) {
			toggleTooltip(type);
		}
	};

	if (!content) {
		return <>{children}</>;
	}

	return (
		<span
			className="relative inline-flex overflow-visible group"
			onClick={handleClick}
		>
			{children}
			<div
				className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs font-normal rounded transition-all duration-200 w-64 z-[100] pointer-events-none ${
					isOpen
						? "opacity-100 visible"
						: "opacity-0 invisible group-hover:opacity-100 group-hover:visible"
				}`}
				role="tooltip"
			>
				{content}
				<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-black" />
			</div>
		</span>
	);
};
