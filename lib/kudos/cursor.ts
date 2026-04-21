/**
 * Opaque cursor codec for the ALL KUDOS feed pagination (plan Q-P1).
 *
 * The cursor is a **composite tuple** (`created_at`, `id`) so exact-timestamp
 * ties during burst inserts produce a deterministic order. Encoded as a
 * URL-safe Base64 JSON string to:
 *
 *   - keep the client opaque (callers treat the string as a blob),
 *   - survive URL encoding without percent-escapes,
 *   - round-trip cleanly between the Route Handler + SQL and the client.
 *
 * Format:
 *   ```
 *   base64url(JSON.stringify([ createdAtIso, id ]))
 *   ```
 *
 * See plan `MaZUn5xHXZ-sun-kudos-live-board` § T017.
 */

export interface DecodedCursor {
  createdAt: string; // ISO-8601 UTC timestamp
  id: number; // kudos.id
}

export class InvalidCursorError extends Error {
  constructor(reason: string) {
    super(`Invalid cursor: ${reason}`);
    this.name = "InvalidCursorError";
  }
}

/** Encode `{ createdAt, id }` into an opaque, URL-safe cursor string. */
export function encodeCursor(input: DecodedCursor): string {
  if (typeof input.createdAt !== "string" || input.createdAt.length === 0) {
    throw new InvalidCursorError("createdAt must be a non-empty ISO string");
  }
  if (!Number.isInteger(input.id) || input.id <= 0) {
    throw new InvalidCursorError("id must be a positive integer");
  }
  const json = JSON.stringify([input.createdAt, input.id]);
  return toBase64Url(json);
}

/** Decode an opaque cursor string back into `{ createdAt, id }`. */
export function decodeCursor(raw: string): DecodedCursor {
  if (typeof raw !== "string" || raw.length === 0) {
    throw new InvalidCursorError("cursor must be a non-empty string");
  }
  let json: string;
  try {
    json = fromBase64Url(raw);
  } catch {
    throw new InvalidCursorError("not a valid base64url payload");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new InvalidCursorError("payload is not valid JSON");
  }
  if (!Array.isArray(parsed) || parsed.length !== 2) {
    throw new InvalidCursorError("payload is not a [createdAt, id] tuple");
  }
  const [createdAt, id] = parsed;
  if (typeof createdAt !== "string" || createdAt.length === 0) {
    throw new InvalidCursorError("createdAt must be a non-empty string");
  }
  // Reject obviously-malformed ISO strings early. Postgres accepts many
  // formats so we don't over-validate — we just ensure it parses.
  if (Number.isNaN(Date.parse(createdAt))) {
    throw new InvalidCursorError("createdAt is not a parseable date");
  }
  if (!Number.isInteger(id) || id <= 0) {
    throw new InvalidCursorError("id must be a positive integer");
  }
  return { createdAt, id };
}

// ---------------------------------------------------------------------------
// base64url helpers — works in both Node (Buffer) and Edge (btoa/atob).
// ---------------------------------------------------------------------------

function toBase64Url(input: string): string {
  // Prefer Buffer on Node; fall back to btoa in Edge / Worker runtimes.
  const base64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(input, "utf8").toString("base64")
      : btoa(unescape(encodeURIComponent(input)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return typeof Buffer !== "undefined"
    ? Buffer.from(padded, "base64").toString("utf8")
    : decodeURIComponent(escape(atob(padded)));
}
