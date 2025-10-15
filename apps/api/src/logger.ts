/* Simple colorized logger utility (no external deps)
 * Usage: import { logger } from './logger'; logger.info('message');
 * Honors: LOG_LEVEL (error,warn,info,debug) and NO_COLOR (any value disables colors)
 */

type LogLevel = "error" | "warn" | "info" | "debug" | "success";

const LEVEL_ORDER: Record<Exclude<LogLevel, "success">, number> = {
	error: 0,
	warn: 1,
	info: 2,
	debug: 3,
};

// ANSI color codes
const colors = {
	reset: "\u001b[0m",
	dim: "\u001b[2m",
	error: "\u001b[31m", // red
	warn: "\u001b[33m", // yellow
	info: "\u001b[36m", // cyan
	success: "\u001b[32m", // green
	debug: "\u001b[90m", // gray
	time: "\u001b[35m", // magenta
	label: "\u001b[1m", // bold
};

function resolveLogLevel(): Exclude<LogLevel, "success"> {
	const raw = (
		process.env.LOG_LEVEL ||
		(process.env.NODE_ENV !== "production" ? "debug" : "info")
	).toLowerCase();
	if (raw === "error" || raw === "warn" || raw === "info" || raw === "debug") {
		return raw;
	}
	return "info";
}

function noColor(): boolean {
	return !!process.env.NO_COLOR;
}

function colorize(code: string, msg: string) {
	if (noColor()) {
		return msg;
	}
	return code + msg + colors.reset;
}

function shouldLog(level: LogLevel): boolean {
	const effectiveLevel: Exclude<LogLevel, "success"> =
		level === "success" ? "info" : (level as Exclude<LogLevel, "success">);
	const currentLevel = resolveLogLevel();
	return LEVEL_ORDER[effectiveLevel] <= LEVEL_ORDER[currentLevel];
}

function baseLog(level: LogLevel, args: unknown[]) {
	if (!shouldLog(level)) {
		return;
	}
	let color = colors.info;
	if (level === "error") {
		color = colors.error;
	} else if (level === "warn") {
		color = colors.warn;
	} else if (level === "debug") {
		color = colors.debug;
	} else if (level === "success") {
		color = colors.success;
	}

	const coloredArgs = args.map((a) =>
		typeof a === "string" ? colorize(color, a) : a,
	);
	// eslint-disable-next-line no-console
	console.log(...coloredArgs);
}

export const logger = {
	error: (...args: unknown[]) => baseLog("error", args),
	warn: (...args: unknown[]) => baseLog("warn", args),
	info: (...args: unknown[]) => baseLog("info", args),
	debug: (...args: unknown[]) => baseLog("debug", args),
	success: (...args: unknown[]) => baseLog("success", args),
	level: () => resolveLogLevel(),
};

export type { LogLevel };
