import { APIErrorResponse } from "@/lib/types";

/**
 * Custom API Error class with status code and fallback information
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public fallbackUsed: boolean = false
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Handle API errors and convert them to a standardized format
 */
export function handleAPIError(error: unknown): APIErrorResponse {
  // Handle APIError instances
  if (error instanceof APIError) {
    return {
      error: error.message,
      status: error.statusCode,
      fallbackUsed: error.fallbackUsed,
    };
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return {
      error: error.message,
      status: 500,
    };
  }

  // Handle unknown errors
  return {
    error: "حدث خطأ غير متوقع في الخادم",
    status: 500,
  };
}

/**
 * Log errors with context
 */
export function logError(context: string, error: unknown): void {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [${context}]`, error);
}

/**
 * Safe error message extraction for user-facing messages
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "حدث خطأ غير متوقع";
}
