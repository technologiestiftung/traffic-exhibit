import { getLanguage, i18n, switchLanguage } from "../../i18n/i18n-utils";
import type { AvailableLanguages } from "../../i18n/translations";

const options: { value: AvailableLanguages; label: string }[] = [
	{ value: "de", label: "DE" },
	{ value: "en", label: "EN" },
];

export function LanguageToggle() {
	const current = getLanguage();

	return (
		<div
			role="group"
			aria-label="Language"
			className="inline-flex border-2 border-black rounded-lg overflow-hidden bg-black font-pixel text-sm font-medium"
		>
			{options.map(({ value, label }) => {
				const isActive = current === value;
				return (
					<button
						key={value}
						type="button"
						onClick={() => value !== current && switchLanguage(value)}
						aria-pressed={isActive}
						aria-label={`${i18n(`languageToggle.aria.${value}`)}${isActive ? ` ${i18n("languageToggle.aria.current")}` : ""}`}
						className={`
							px-4 py-2 min-w-[3.5rem] transition-colors
							${value === "de" ? "rounded-l-md" : "rounded-r-md"}
							${isActive ? "bg-bp-gray-loading text-black" : "bg-black text-white"}
						`}
					>
						{label}
					</button>
				);
			})}
		</div>
	);
}
