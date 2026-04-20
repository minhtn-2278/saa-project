import {
  HASHTAG_LABEL_REGEX,
  MAX_HASHTAG_LABEL_LENGTH,
  MIN_HASHTAG_LABEL_LENGTH,
} from "@/lib/constants/kudos";

/**
 * Validates a hashtag label without normalisation.
 * Returns an error key (matching `messages/*.json` → `kudos.writeKudo.errors.hashtag.*`)
 * when invalid, or `null` when valid.
 *
 * Spec: FR-006
 * - Length: 2..32
 * - Charset: Vietnamese unicode letters, digits, underscore
 * - No leading `#`, no whitespace
 */
export function validateHashtagLabel(label: string): string | null {
  const trimmed = label.trim();
  if (trimmed.length < MIN_HASHTAG_LABEL_LENGTH) return "charset";
  if (trimmed.length > MAX_HASHTAG_LABEL_LENGTH) return "charset";
  if (!HASHTAG_LABEL_REGEX.test(trimmed)) return "charset";
  return null;
}

/**
 * Normalises a hashtag label into its dedup slug.
 *
 * Rules (matches the API-layer upsert in `POST /api/kudos` and the partial
 * unique index on `hashtags.slug WHERE deleted_at IS NULL`):
 *
 *   1. Unicode NFC normalisation so visually identical inputs collapse.
 *   2. Case fold to lowercase (`toLowerCase`) — locale-independent.
 *   3. Diacritics are PRESERVED (per spec.md FR-006 — `slug` is derived
 *      server-side: lowercase, Unicode NFC-normalised, diacritics preserved).
 *
 * Does not mutate whitespace handling: callers should `validateHashtagLabel`
 * first. Throws if the label is invalid.
 */
export function hashtagSlug(label: string): string {
  const err = validateHashtagLabel(label);
  if (err) {
    throw new Error(`Invalid hashtag label: ${err}`);
  }
  return label.trim().normalize("NFC").toLowerCase();
}

/**
 * Title (Danh hiệu) slug — same pattern as hashtag but allows spaces
 * converted to hyphens, and is 2..60 chars.
 *
 * Spec FR-006a: Title must be 2..60 chars, unique per active row
 * (case-insensitive). Diacritics preserved.
 */
export function titleSlug(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 60) {
    throw new Error("Invalid title name: length");
  }
  return (
    trimmed
      .normalize("NFC")
      .toLowerCase()
      // Collapse consecutive whitespace into one hyphen.
      .replace(/\s+/g, "-")
  );
}
