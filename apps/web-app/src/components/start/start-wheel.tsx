import { EqualSegmentsDisc } from "./equal-segment-disk";
import { trafficColors, uiColors } from "../match/utils";
import { useWebSocket } from "../../hooks/useWebSocket";

type StartWheelProps = {
	isLoading?: boolean;
	animateDecorations?: boolean;
};

export function StartWheel({
	isLoading = false,
	animateDecorations = false,
}: StartWheelProps) {
	const { occupiedBlocks } = useWebSocket();
	const isLargeScreen = window.innerWidth > 1620;

	return (
		<div className="relative flex basis-4/7 flex-col items-center gap-8">
			<div className="relative">
				<div className="pointer-events-none absolute inset-0 hidden lg:block">
					<img
						src="/bike.svg"
						alt="bike"
						className={`absolute -right-30 bottom-20 w-31 2xl:w-38 rotate-[120deg] opacity-90 drop-shadow-[0_12px_22px_rgba(0,0,0,0.45)] ${animateDecorations ? "animate-pulse-scale-soft-slow" : ""}`}
					/>
					<img
						src="/walking.svg"
						alt="walking"
						className={`absolute -left-36 top-20 w-28 2xl:w-43 rotate-[-60deg] opacity-90 drop-shadow-[0_12px_22px_rgba(0,0,0,0.45)] ${animateDecorations ? "animate-pulse-scale-soft-slow" : ""}`}
					/>
					<img
						src="/lkw.svg"
						alt="truck"
						className={`absolute -left-40 bottom-10 w-35 2xl:w-51 rotate-[-120deg] opacity-90 drop-shadow-[0_12px_22px_rgba(0,0,0,0.45)] ${animateDecorations ? "animate-pulse-scale-soft-slow" : ""}`}
					/>
					<img
						src="/icon.svg"
						alt="car"
						className={`absolute -top-6 -right-30 w-43 2xl:w-55 rotate-[50deg] opacity-90 drop-shadow-[0_12px_22px_rgba(0,0,0,0.45)] ${animateDecorations ? "animate-pulse-scale-soft-slow" : ""}`}
					/>
				</div>

				<div className="relative flex items-center justify-center rounded-full border-[14px] border-black bg-gradient-to-b from-[#1b1b1e] to-[#333338] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
					<EqualSegmentsDisc
						size={isLargeScreen ? 700 : 520}
						occupiedBlocks={occupiedBlocks}
						segmentColors={[
							{ occupied: trafficColors.yellow, empty: uiColors.grayLoading },
						]}
						showLabels
						isLoading={isLoading}
					/>
					<div className="pointer-events-none absolute inset-16 flex items-center justify-center">
						<div className="relative flex size-60 2xl:size-[350px] items-center justify-center rounded-full bg-black">
							<div className="absolute inset-4 rounded-full border-4 border-bp-yellow" />
							{/* commented out until functionality is added */}
							{/* <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full bg-[#25252a] text-bp-red">
								<div
									aria-hidden
									className="h-12 w-12 bg-white"
									style={{
										WebkitMask: "url(/flip.svg) center / contain no-repeat",
										mask: "url(/flip.svg) center / contain no-repeat",
									}}
								/>
							</div> */}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
