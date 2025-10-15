// Plain JS logger for scripts (mirrors apps/api/src/logger.ts simplified)
const colors = {
  reset: "\u001b[0m",
  dim: "\u001b[2m",
  error: "\u001b[31m", // red
  warn: "\u001b[33m", // yellow
  info: "\u001b[34m", // blue
  success: "\u001b[32m", // green
  debug: "\u001b[90m", // gray
  time: "\u001b[35m", // magenta
  label: "\u001b[1m", // bold
};

const LEVEL_ORDER = { error: 0, warn: 1, info: 2, debug: 3 };

function resolveLevel() {
  const raw = (
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV !== "production" ? "debug" : "info")
  ).toLowerCase();
  return ["error", "warn", "info", "debug"].includes(raw) ? raw : "info";
}

function noColor() {
  return !!process.env.NO_COLOR;
}
function colorize(code, msg) {
  return noColor() ? msg : code + msg + colors.reset;
}
function shouldLog(level) {
  return LEVEL_ORDER[level] <= LEVEL_ORDER[resolveLevel()];
}

function base(level, args) {
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
    typeof a === "string" ? colorize(color, a) : a
  );
  // eslint-disable-next-line no-console
  console.log(...coloredArgs);
}

export const logger = {
  error: (...a) => base("error", a),
  warn: (...a) => base("warn", a),
  info: (...a) => base("info", a),
  debug: (...a) => base("debug", a),
  success: (...a) => base("success", a),
  // Print a timestamp (or any provided string) in time color WITHOUT a newline
  // so the next log.* call appears on the same line. Adds a trailing space.
  time: (...a) => {
    const parts = a.map((x) => (typeof x === "string" ? x : String(x)));
    const msg = parts.join(" ");
    process.stdout.write(`${colorize(colors.time, msg)} `);
  },
  level: () => resolveLevel(),
};

export default logger;
