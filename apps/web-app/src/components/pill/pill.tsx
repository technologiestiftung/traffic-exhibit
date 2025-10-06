import React from "react";

type pillProps = {
	value: string;
	backgroundColor?: string;
	textColor?: string;
	className?: string;
};

export const Pill: React.FC<pillProps> = ({
	value,
	backgroundColor = "bg-gray-200",
	textColor = "text-gray-800",
	className = "",
}) => {
	return (
		<span
			className={`inline-block px-3 py-1 text-sm font-medium rounded-full h-fit ${backgroundColor} ${textColor} ${className}`}
		>
			{value}
		</span>
	);
};
