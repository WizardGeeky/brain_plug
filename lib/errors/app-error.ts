import { NextResponse } from "next/server";

export type ErrorCode =
  | "AUTH_REQUIRED"
  | "INVALID_CREDENTIALS"
  | "INVALID_OTP"
  | "OTP_EXPIRED"
  | "OTP_RATE_LIMITED"
  | "ACCESS_DENIED"
  | "TENANT_ACCESS_DENIED"
  | "AGENT_NOT_FOUND"
  | "MODEL_NOT_AVAILABLE"
  | "API_KEY_INVALID"
  | "API_KEY_REVOKED"
  | "GEMINI_API_KEY_NOT_CONFIGURED"
  | "DOCUMENT_PROCESSING_FAILED"
  | "RAG_FAILED"
  | "AI_PROVIDER_ERROR"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_SERVER_ERROR"
  | "WIDGET_ORIGIN_NOT_ALLOWED";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    code: ErrorCode = "INTERNAL_SERVER_ERROR",
    statusCode = 400,
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function apiSuccess<T>(
  data: T,
  requestId = crypto.randomUUID(),
  status = 200
) {
  return NextResponse.json(
    {
      success: true,
      data,
      requestId,
    },
    { status }
  );
}

export function apiError(
  error: unknown,
  requestId = crypto.randomUUID()
) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        requestId,
      },
      { status: error.statusCode }
    );
  }

  // Handle Zod Validation Errors
  if (error && typeof error === "object" && "issues" in error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: (error as any).issues,
        },
        requestId,
      },
      { status: 422 }
    );
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred";

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message,
      },
      requestId,
    },
    { status: 500 }
  );
}
