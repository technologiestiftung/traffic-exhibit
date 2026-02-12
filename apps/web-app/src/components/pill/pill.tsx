import React from "react";

type pillProps = {
	value: string;
	className?: string;
};

export const Pill: React.FC<pillProps> = ({ value, className = "" }) => {
	return (
		<span className={`p-2 text-xs font-medium rounded-xs h-fit ${className}`}>
			{value}
		</span>
	);
};
