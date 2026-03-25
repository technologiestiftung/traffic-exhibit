import type { ReactNode } from "react";
import { StartWheel } from "./start-wheel";
import { LanguageToggle } from "../language-toggle/language-toggle";

type StartLayoutProps = {
	isLoading?: boolean;
	animateDecorations?: boolean;
	children: ReactNode;
};

export const StartLayout = ({
	isLoading = false,
	animateDecorations = false,
	children,
}: StartLayoutProps) => {
	return (
		<div
			className={`w-full bg-gradient-to-b from-[#171719] via-[#3b3b41] to-[#d7d7dd] text-white h-screen overflow-y-auto`}
		>
			<div
				className={`mx-auto flex items-center justify-center gap-10 max-w-[1540px] xl:max-w-[1920px] flex-col px-6 xl:px-0 py-10 min-h-screen`}
			>
				<LanguageToggle />
				<div
					className={`flex w-full flex-col gap-12 xl:gap-20 xl:flex-row xl:items-center xl:justify-center`}
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
