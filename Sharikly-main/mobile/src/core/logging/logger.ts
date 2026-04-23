type LogLevel = "debug" | "info" | "warn" | "error";

const SENSITIVE_KEYS = new Set([
  "authorization",
  "access",
  "refresh",
  "password",
  "token",
  "access_token",
  "refresh_token",
]);

function redact(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    return value.length > 8 ? `${value.slice(0, 4)}…` : "[redacted]";
  }
  if (Array.isArray(value)) {
    return value.map(redact);
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        out[k] = "[redacted]";
      } else {
        out[k] = redact(v);
      }
    }
    return out;
  }
  return value;
}

function emit(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const payload = meta ? { ...meta, metaRedacted: redact(meta) } : undefined;
  if (__DEV__) {
    console[level === "debug" ? "log" : level](`[Ekra][${level}] ${message}`, payload ?? "");
  } else {
    console.log(
      JSON.stringify({
        level,
        message,
        ts: new Date().toISOString(),
        ...payload,
      })
    );
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => emit("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => emit("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit("error", message, meta),
};
