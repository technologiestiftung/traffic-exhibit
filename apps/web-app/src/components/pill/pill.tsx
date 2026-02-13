import React from "react";

type pillProps = {
	value: string;
	className?: string;
	children?: React.ReactNode;
};

export const Pill: React.FC<pillProps> = ({
	value,
	className = "",
	children,
}) => {
	return (
		<div
			className={`relative group flex items-center gap-2 p-2 text-xs font-medium rounded-xs h-fit ${className}`}
		>
			<span className="font-pixel">{value}</span>
			{children}
		</div>
	);
};
