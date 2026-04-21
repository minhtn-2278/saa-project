import { z } from "zod";
import { decodeCursor, type DecodedCursor } from "@/lib/kudos/cursor";

/**
 * Zod schemas for the Sun* Kudos Live-board Route Handlers.
 * See plan `MaZUn5xHXZ-sun-kudos-live-board` § T016.
 *
 * Error messages use literal strings — these validators run at the API
 * boundary (not on the client), so the localisation / error-key pattern used
 * by `lib/validations/kudos.ts` isn't required.
 */

// ---------------------------------------------------------------------------
// GET /api/kudos — extended with cursor + departmentId + sort flag.
// The legacy `page` + `limit` (offset) mode is preserved for the Viết Kudo
// path; callers pick one mode by presence of `cursor`.
// ---------------------------------------------------------------------------

const cursorField = z
  .string()
  .optional()
  .transform((raw, ctx): DecodedCursor | undefined => {
    if (raw === undefined || raw.length === 0) return undefined;
    try {
      return decodeCursor(raw);
    } catch (err) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: err instanceof Error ? err.message : "Invalid cursor",
      });
      return z.NEVER;
    }
  });

export const liveBoardListKudosParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  cursor: cursorField,
  titleId: z.coerce.number().int().positive().optional(),
  hashtagId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
});
export type LiveBoardListKudosParams = z.infer<
  typeof liveBoardListKudosParamsSchema
>;

// ---------------------------------------------------------------------------
// GET /api/kudos/highlight — top-5 by heart count, same filters as the feed.
// No pagination: the endpoint always returns 0..5 items.
// ---------------------------------------------------------------------------

export const highlightKudosParamsSchema = z.object({
  hashtagId: z.coerce.number().int().positive().optional(),
  departmentId: z.coerce.number().int().positive().optional(),
});
export type HighlightKudosParams = z.infer<typeof highlightKudosParamsSchema>;

// ---------------------------------------------------------------------------
// POST | DELETE /api/kudos/{id}/like — path-only params.
// ---------------------------------------------------------------------------

export const likeParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type LikeParams = z.infer<typeof likeParamsSchema>;

// ---------------------------------------------------------------------------
// GET /api/hashtags — extended with `sort` for the Live-board filter dropdown.
// `sort='usage'` returns `ORDER BY usage_count DESC, label ASC` (top-used
// first). `sort='recent'` preserves the Viết Kudo typeahead behaviour.
// ---------------------------------------------------------------------------

export const hashtagsListParamsSchema = z.object({
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["usage", "recent"]).default("recent"),
});
export type HashtagsListParams = z.infer<typeof hashtagsListParamsSchema>;
