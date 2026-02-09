type LogLevel = "info" | "warn" | "error";

type LogPayload = Record<string, unknown>;

function write(level: LogLevel, event: string, payload: LogPayload = {}) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...payload,
  });

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function logInfo(event: string, payload?: LogPayload) {
  write("info", event, payload);
}

export function logWarn(event: string, payload?: LogPayload) {
  write("warn", event, payload);
}

export function logError(event: string, payload?: LogPayload) {
  write("error", event, payload);
}
