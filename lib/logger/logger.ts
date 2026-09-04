export interface LogContext {
  requestId?: string;
  userId?: string;
  tenantId?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = [
  "password",
  "passwordhash",
  "password_hash",
  "otp",
  "otphash",
  "otp_hash",
  "token",
  "refreshtoken",
  "jwt",
  "secret",
  "apikey",
  "api_key",
  "authorization",
];

function sanitize(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s))) {
      clean[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      clean[key] = sanitize(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export class Logger {
  public static info(message: string, context?: LogContext) {
    this.log("INFO", message, context);
  }

  public static warn(message: string, context?: LogContext) {
    this.log("WARN", message, context);
  }

  public static error(message: string, error?: unknown, context?: LogContext) {
    const errorDetails =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack:
              process.env.NODE_ENV === "development" ? error.stack : undefined,
          }
        : error;

    this.log("ERROR", message, { ...context, error: errorDetails });
  }

  private static log(
    level: "INFO" | "WARN" | "ERROR",
    message: string,
    context?: LogContext
  ) {
    const logPayload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context ? (sanitize(context) as Record<string, unknown>) : {}),
    };

    if (level === "ERROR") {
      console.error(JSON.stringify(logPayload));
    } else if (level === "WARN") {
      console.warn(JSON.stringify(logPayload));
    } else {
      console.log(JSON.stringify(logPayload));
    }
  }
}
