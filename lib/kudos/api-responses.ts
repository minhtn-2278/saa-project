import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  NoEmployeeProfileError,
  NotAuthenticatedError,
} from "@/lib/auth/current-employee";

/**
 * Standardised error envelope used by every Kudo Route Handler.
 * Matches the `ErrorResponse` shape in api-docs.yaml.
 */
export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

/**
 * Convert a Zod validation error into the standard envelope. Each issue's
 * `message` field is kept as-is (Zod schemas are configured to emit i18n keys
 * — the client resolves them via `useTranslations`).
 */
export function zodErrorToResponse(error: ZodError): NextResponse {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? String(issue.path[0]) : "_";
    if (!details[path]) details[path] = [];
    details[path].push(issue.message);
  }
  return NextResponse.json<ErrorEnvelope>(
    {
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details,
      },
    },
    { status: 422 },
  );
}

/**
 * Translate `getCurrentEmployee()` failures to the correct HTTP status.
 */
export function authErrorToResponse(err: unknown): NextResponse | null {
  if (err instanceof NotAuthenticatedError) {
    return NextResponse.json<ErrorEnvelope>(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 },
    );
  }
  if (err instanceof NoEmployeeProfileError) {
    return NextResponse.json<ErrorEnvelope>(
      {
        error: {
          code: "NO_EMPLOYEE_PROFILE",
          message: "No matching employees row",
        },
      },
      { status: 403 },
    );
  }
  return null;
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string[]>,
): NextResponse {
  return NextResponse.json<ErrorEnvelope>(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}
