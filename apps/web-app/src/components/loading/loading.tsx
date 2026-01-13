import { i18n } from "../../i18n/i18n-utils";

export const Loading = () => {
	return (
		<div
			className="min-h-screen w-full bg-gradient-to-b from-[#171719] via-[#3b3b41] to-[#d7d7dd] text-white"
			style={{ fontFamily: '"Pixel Grotesk", "Space Grotesk", sans-serif' }}
		>
			<div className="mx-auto flex min-h-screen max-w-[1540px] flex-col items-center justify-center gap-10 px-6 py-12 lg:px-10">
				<div className="flex w-full flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
					{/* Left: same disc proportions as Start */}
					<div className="relative flex flex-1 flex-col items-center gap-8">
						<div className="relative">
							{/* Decorative icons around the disc (desktop only) */}
							<div className="pointer-events-none absolute inset-0 hidden lg:block">
								<img
									src="/bike.svg"
									alt="bike"
									className="absolute -right-40 bottom-20 w-36 rotate-[-10deg] opacity-90 drop-shadow-[0_12px_22px_rgba(0,0,0,0.45)] animate-pulse-scale-soft-slow"
								/>
								<img
									src="/walking.svg"
									alt="walking"
									className="absolute -left-36 top-20 w-32 rotate-[-18deg] opacity-90 drop-shadow-[0_12px_22px_rgba(0,0,0,0.45)] animate-pulse-scale-soft-slow"
								/>
								<img
									src="/lkw.svg"
									alt="truck"
									className="absolute -left-44 bottom-10 w-40 rotate-[12deg] opacity-90 drop-shadow-[0_12px_22px_rgba(0,0,0,0.45)] animate-pulse-scale-soft-slow"
								/>
							</div>

							<div className="absolute -top-6 -right-40 hidden rotate-6 items-center justify-center lg:flex">
								{/* Local SVG badge (no background). Placed in `apps/web-app/public/icon.svg`. */}
								<img
									src="/icon.svg"
									width={72 * 2.5}
									height={48 * 2.5}
									alt="badge"
									className="block animate-pulse-scale-soft-slow"
								/>
							</div>
							<svg
								aria-hidden
								width="220"
								height="60"
								viewBox="0 0 220 60"
								className="absolute -top-16 -right-12 hidden text-black/70 lg:block"
							>
							</svg>

							{/* Keep the disc fixed; animate segment fills in sequence */}
							<div className="relative">
								<div className="relative flex items-center justify-center rounded-full border-[14px] border-black bg-gradient-to-b from-[#1b1b1e] to-[#333338] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
									{/* Start-style 10-segment disc; we only animate the fills */}
									<svg
										width="520"
										height="520"
										viewBox="0 0 520 520"
										aria-hidden
										className="block"
									>
									<g>
										<path
											d="M 260 260 L 260 10 A 250 250 0 0 1 406.9463130731183 57.74575140626314 Z"
											stroke="#fff"
											strokeWidth="2"
											strokeLinejoin="round"
											className="loading-seg loading-seg-1 loading-seg-color-1"
										/>
										<text
											x="317.9406864453026"
											y="81.6769031946587"
											textAnchor="middle"
											dominantBaseline="central"
											fontSize="36.4"
										>
											1
										</text>
									</g>
									<g>
										<path
											d="M 260 260 L 406.9463130731183 57.74575140626314 A 250 250 0 0 1 497.76412907378835 182.74575140626314 Z"
											stroke="#fff"
											strokeWidth="2"
											strokeLinejoin="round"
											className="loading-seg loading-seg-2 loading-seg-color-2"
										/>
										<text
											x="411.6906864453026"
											y="149.79026519516128"
											textAnchor="middle"
											dominantBaseline="central"
											fontSize="36.4"
										>
											2
										</text>
									</g>
									<g>
										<path
											d="M 260 260 L 497.76412907378835 182.74575140626314 A 250 250 0 0 1 497.76412907378835 337.25424859373686 Z"
											stroke="#fff"
											strokeWidth="2"
											strokeLinejoin="round"
											className="loading-seg loading-seg-3 loading-seg-color-3"
										/>
										<text x="447.5" y="260" textAnchor="middle" dominantBaseline="central" fontSize="36.4">
											3
										</text>
									</g>
									<g>
										<path
											d="M 260 260 L 497.76412907378835 337.25424859373686 A 250 250 0 0 1 406.9463130731183 462.25424859373686 Z"
											stroke="#fff"
											strokeWidth="2"
											strokeLinejoin="round"
											className="loading-seg loading-seg-4 loading-seg-color-4"
										/>
										<text
											x="411.6906864453026"
											y="370.2097348048387"
											textAnchor="middle"
											dominantBaseline="central"
											fontSize="36.4"
										>
											4
										</text>
									</g>
									<g>
										<path
											d="M 260 260 L 406.9463130731183 462.25424859373686 A 250 250 0 0 1 260 510 Z"
											stroke="#fff"
											strokeWidth="2"
											strokeLinejoin="round"
											className="loading-seg loading-seg-5 loading-seg-color-1"
										/>
										<text
											x="317.9406864453026"
											y="438.32309680534127"
											textAnchor="middle"
											dominantBaseline="central"
											fontSize="36.4"
										>
											5
										</text>
									</g>
									<g>
										<path
											d="M 260 260 L 260 510 A 250 250 0 0 1 113.05368692688174 462.25424859373686 Z"
											stroke="#fff"
											strokeWidth="2"
											strokeLinejoin="round"
											className="loading-seg loading-seg-6 loading-seg-color-2"
										/>
										<text
											x="202.05931355469738"
											y="438.3230968053413"
											textAnchor="middle"
											dominantBaseline="central"
											fontSize="36.4"
										>
											6
										</text>
									</g>
									<g>
										<path
											d="M 260 260 L 113.05368692688174 462.25424859373686 A 250 250 0 0 1 22.235870926211618 337.25424859373686 Z"
											stroke="#fff"
											strokeWidth="2"
											strokeLinejoin="round"
											className="loading-seg loading-seg-7 loading-seg-color-3"
										/>
										<text
											x="108.30931355469738"
											y="370.2097348048387"
											textAnchor="middle"
											dominantBaseline="central"
											fontSize="36.4"
										>
											7
										</text>
									</g>
									<g>
										<path
											d="M 260 260 L 22.235870926211618 337.25424859373686 A 250 250 0 0 1 22.23587092621159 182.7457514062632 Z"
											stroke="#fff"
											strokeWidth="2"
											strokeLinejoin="round"
											className="loading-seg loading-seg-8 loading-seg-color-4"
										/>
										<text x="72.5" y="260" textAnchor="middle" dominantBaseline="central" fontSize="36.4">
											8
										</text>
									</g>
									<g>
										<path
											d="M 260 260 L 22.23587092621159 182.7457514062632 A 250 250 0 0 1 113.05368692688168 57.74575140626317 Z"
											stroke="#fff"
											strokeWidth="2"
											strokeLinejoin="round"
											className="loading-seg loading-seg-9 loading-seg-color-1"
										/>
										<text
											x="108.30931355469733"
											y="149.7902651951613"
											textAnchor="middle"
											dominantBaseline="central"
											fontSize="36.4"
										>
											9
										</text>
									</g>
									<g>
										<path
											d="M 260 260 L 113.05368692688168 57.74575140626317 A 250 250 0 0 1 259.99999999999994 10 Z"
											stroke="#fff"
											strokeWidth="2"
											strokeLinejoin="round"
											className="loading-seg loading-seg-10 loading-seg-color-2"
										/>
										<text
											x="202.05931355469733"
											y="81.6769031946587"
											textAnchor="middle"
											dominantBaseline="central"
											fontSize="36.4"
										>
											10
										</text>
									</g>
									<circle cx="260" cy="260" r="150" fill="#fff" />
								</svg>

								</div>
							</div>

							{/* Inner disc (same as Start) - stays fixed */}
							<div className="pointer-events-none absolute inset-16 flex items-center justify-center">
								<div className="relative flex h-60 w-60 items-center justify-center rounded-full bg-black/80">
									<div className="absolute inset-4 rounded-full border-4 border-[#E7FE64]" />
									<div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full bg-[#25252a] text-[#E7FE64]">
										<div
											aria-hidden
											className="h-12 w-12 bg-white"
											style={{
												WebkitMask: 'url(/flip.svg) center / contain no-repeat',
												mask: 'url(/flip.svg) center / contain no-repeat',
											}}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>


					{/* Right: same text block proportions as Start */}
					<div className="flex max-w-md flex-1 flex-col items-start gap-4 text-left text-white drop-shadow-lg">
						<h1 className="text-5xl font-semibold tracking-wide">
							{i18n("loading.title")}
						</h1>
						<p className="text-lg text-white/80">
							{i18n("loading.trafficMixAnalyzing")}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};
