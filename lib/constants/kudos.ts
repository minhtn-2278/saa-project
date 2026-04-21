/**
 * Domain constants for the Viết Kudo feature.
 *
 * Single source of truth for field limits that are referenced by
 * Zod schemas, API handlers, and React form components.
 * Source: spec.md FR-006 / FR-006a / FR-007 / FR-008b.
 */

export const MAX_HASHTAGS_PER_KUDO = 5;
export const MIN_HASHTAGS_PER_KUDO = 1;
export const MAX_IMAGES_PER_KUDO = 5;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_TOTAL_IMAGE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_ANONYMOUS_ALIAS_LENGTH = 60;
export const MAX_BODY_PLAIN_CHARS = 5000;

export const MIN_TITLE_NAME_LENGTH = 2;
export const MAX_TITLE_NAME_LENGTH = 60;

export const MIN_HASHTAG_LABEL_LENGTH = 2;
export const MAX_HASHTAG_LABEL_LENGTH = 32;

export const KUDO_IMAGES_BUCKET = process.env.KUDO_IMAGES_BUCKET || "kudo-images";

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/**
 * Allowed charset for hashtag labels — Vietnamese unicode letters, digits,
 * and underscore. No spaces, no `#` prefix, no punctuation.
 * Used by validations + the slug normaliser.
 */
export const HASHTAG_LABEL_REGEX = /^[\p{L}\p{N}_]+$/u;

/** Dedup guard window — server rejects duplicates within this many ms. */
export const KUDO_SUBMIT_GUARD_WINDOW_MS = 2000;

/** Recipient / mention autocomplete debounce. */
export const EMPLOYEE_SEARCH_DEBOUNCE_MS = 250;

/**
 * Session-storage key used by `useDraftSync`. Namespaced with a version so
 * schema breaks can bump it cleanly.
 */
export const KUDO_DRAFT_STORAGE_KEY = "saa.kudo.write-draft.v1";
