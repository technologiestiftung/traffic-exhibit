import type { ReactNode } from "react";
import { StartWheel } from "./start-wheel";

type StartLayoutProps = {
	isLoading?: boolean;
	animateDecorations?: boolean;
	children: ReactNode;
	variant?: "start" | "loading";
};

export const StartLayout = ({
	isLoading = false,
	animateDecorations = false,
	children,
	variant = "start",
}: StartLayoutProps) => {
	const isStartVariant = variant === "start";

	return (
		<div
			className={`w-full bg-gradient-to-b from-[#171719] via-[#3b3b41] to-[#d7d7dd] text-white ${
				isStartVariant ? "h-screen overflow-y-auto" : "min-h-screen"
			}`}
		>
			<div
				className={`mx-auto flex items-center justify-center gap-10 ${
					isStartVariant
						? "min-h-full max-w-[1540px] xl:max-w-[1820px] flex-col px-6 xl:px-0 py-10"
						: "min-h-screen max-w-[1540px] flex-col px-6 py-12 lg:px-10"
				}`}
			>
				<div
					className={`flex w-full flex-col ${
						isStartVariant
							? "gap-12 xl:gap-20 xl:flex-row xl:items-center xl:justify-center"
							: "gap-12 lg:flex-row lg:items-center lg:justify-between"
					}`}
				>
					<StartWheel
						isLoading={isLoading}
						animateDecorations={animateDecorations}
					/>

					<div className="flex max-w-md flex-1 flex-col items-start gap-4 text-left text-white drop-shadow-lg">
						{children}
					</div>
				</div>
			</div>
		</div>
	);
};
