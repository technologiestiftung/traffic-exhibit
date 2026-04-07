import React, { useEffect, useRef } from "react";
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
	const containerRef = useRef<HTMLSpanElement>(null);
	const { openTooltipType, toggleTooltip, closeTooltip } =
		useInfoTooltipStore();
	const isOpen = openTooltipType === type;

	useEffect(() => {
		let cleanup: (() => void) | undefined;
		if (isOpen) {
			const handlePointerDown = (event: PointerEvent) => {
				const el = containerRef.current;
				if (el && !el.contains(event.target as Node)) {
					closeTooltip();
				}
			};

			document.addEventListener("pointerdown", handlePointerDown);
			cleanup = () => {
				document.removeEventListener("pointerdown", handlePointerDown);
			};
		}
		return cleanup;
	}, [isOpen, closeTooltip]);

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
			ref={containerRef}
			className="relative inline-flex overflow-visible group"
			onClick={handleClick}
		>
			{children}
			<div
				className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black tracking-normal text-white text-xs font-normal rounded transition-all duration-200 w-64 z-[100] pointer-events-none ${
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
