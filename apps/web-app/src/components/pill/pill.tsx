import React from "react";

type pillProps = {
	value: string;
	className?: string;
};

export const Pill: React.FC<pillProps> = ({ value, className = "" }) => {
	return (
		<span
			className={`px-3 py-1 text-xs font-medium rounded-full h-fit ${className}`}
		>
			{value}
		</span>
	);
};
