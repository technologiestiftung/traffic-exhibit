import { parse, format } from "date-fns";

export const formatDdMmmYyyy = (value?: string) => {
	if (!value) {
		return "";
	}
	// matches: 2025-09-17 14:00:00+00:00
	const d = parse(value, "yyyy-MM-dd HH:mm:ssXXX", new Date());
	if (Number.isNaN(d.getTime())) {
		return value;
	}
	return format(d, "dd MMM yyyy");
};
