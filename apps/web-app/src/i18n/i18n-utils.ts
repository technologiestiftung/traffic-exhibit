import { type AvailableTranslations, translations } from "./translations";
import { isLanguageSupported } from "./is-language-supported";

export function formatNumber(number: number, options?: { toFixed?: number }) {
	const { toFixed } = options ? options : { toFixed: 0 };

	const language = getLanguage();

	if (toFixed === undefined) {
		return new Intl.NumberFormat(language).format(number);
	}

	return new Intl.NumberFormat(language).format(
		Number(number.toFixed(toFixed)),
	);
}

export function i18n(key: AvailableTranslations) {
	const language = getLanguage();

	return (translations[language] as Record<AvailableTranslations, string>)[key];
}

export function getLanguage() {
	const pathname =
		typeof window !== "undefined" ? window.location.pathname : "/";
	const language = pathname.split("/")[1];

	if (isLanguageSupported(language)) {
		return language;
	}

	return "de";
}
