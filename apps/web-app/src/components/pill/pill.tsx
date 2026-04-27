import React from "react";

type pillProps = {
	value: string;
	className?: string;
	/** Classes for the label text (size/weight/color). */
	valueClassName?: string;
	children?: React.ReactNode;
};

export const Pill: React.FC<pillProps> = ({
	value,
	className = "",
	valueClassName = "font-sans text-[15px] 2xl:text-[17px] font-medium leading-snug text-white",
	children,
}) => {
	return (
		<div
			className={`relative group flex items-center gap-2 p-2 rounded-xs h-fit ${className}`}
		>
			<span className={valueClassName}>{value}</span>
			{children}
		</div>
	);
};
