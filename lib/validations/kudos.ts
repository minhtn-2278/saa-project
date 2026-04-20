import { z } from "zod";
import {
  HASHTAG_LABEL_REGEX,
  MAX_ANONYMOUS_ALIAS_LENGTH,
  MAX_BODY_PLAIN_CHARS,
  MAX_HASHTAGS_PER_KUDO,
  MAX_HASHTAG_LABEL_LENGTH,
  MAX_IMAGES_PER_KUDO,
  MAX_TITLE_NAME_LENGTH,
  MIN_HASHTAGS_PER_KUDO,
  MIN_HASHTAG_LABEL_LENGTH,
  MIN_TITLE_NAME_LENGTH,
} from "@/lib/constants/kudos";

/**
 * Validation error messages are i18n KEYS (not literal strings). The React
 * form layer resolves each key via `useTranslations('kudos.writeKudo.errors')`.
 * Keep them in sync with `messages/*.json` → `kudos.writeKudo.errors.*`.
 * (Plan § Validation error i18n.)
 */

const hashtagLabelSchema = z
  .string()
  .min(MIN_HASHTAG_LABEL_LENGTH, { message: "hashtag.charset" })
  .max(MAX_HASHTAG_LABEL_LENGTH, { message: "hashtag.charset" })
  .regex(HASHTAG_LABEL_REGEX, { message: "hashtag.charset" });

const hashtagEntrySchema = z.union([
  z.object({ id: z.number().int().positive() }),
  z.object({ label: hashtagLabelSchema }),
]);

/**
 * ProseMirror document shape. Kept loose at the Zod layer — the sanitiser
 * (lib/kudos/sanitize-body.ts) is the real allow-list enforcer.
 */
const prosemirrorDocSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(z.unknown()).optional(),
  })
  .passthrough();

export const createKudoRequestSchema = z
  .object({
    recipientId: z
      .number()
      .int()
      .positive({ message: "recipient.required" }),

    titleId: z
      .number()
      .int()
      .positive()
      .nullable()
      .optional(),

    titleName: z
      .string()
      .trim()
      .min(MIN_TITLE_NAME_LENGTH, { message: "title.length" })
      .max(MAX_TITLE_NAME_LENGTH, { message: "title.length" })
      .nullable()
      .optional(),

    body: prosemirrorDocSchema,

    hashtags: z
      .array(hashtagEntrySchema)
      .min(MIN_HASHTAGS_PER_KUDO, { message: "hashtag.required" })
      .max(MAX_HASHTAGS_PER_KUDO, { message: "hashtag.max" }),

    imageIds: z
      .array(z.number().int().positive())
      .max(MAX_IMAGES_PER_KUDO, { message: "image.max" })
      .optional()
      .default([]),

    isAnonymous: z.boolean().optional().default(false),

    anonymousAlias: z
      .string()
      .trim()
      .max(MAX_ANONYMOUS_ALIAS_LENGTH, { message: "anonymousAlias.maxLength" })
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    // title: either titleId or titleName, not both, at least one required
    const hasId = data.titleId != null;
    const hasName = data.titleName != null && data.titleName.length > 0;
    if (!hasId && !hasName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["titleId"],
        message: "title.required",
      });
    }
    if (hasId && hasName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["titleName"],
        message: "title.mutuallyExclusive",
      });
    }

    // anonymousAlias only meaningful when isAnonymous
    if (!data.isAnonymous && data.anonymousAlias) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["anonymousAlias"],
        message: "anonymousAlias.onlyWhenAnonymous",
      });
    }

    // hashtag uniqueness: an id can't appear twice; a label can't duplicate another label
    const seenIds = new Set<number>();
    const seenLabels = new Set<string>();
    for (const tag of data.hashtags) {
      if ("id" in tag) {
        if (seenIds.has(tag.id)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["hashtags"],
            message: "hashtag.duplicate",
          });
        }
        seenIds.add(tag.id);
      } else {
        const key = tag.label.normalize("NFC").toLowerCase();
        if (seenLabels.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["hashtags"],
            message: "hashtag.duplicate",
          });
        }
        seenLabels.add(key);
      }
    }

    // imageIds uniqueness
    const imgs = data.imageIds ?? [];
    if (new Set(imgs).size !== imgs.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["imageIds"],
        message: "image.duplicate",
      });
    }
  });

export type CreateKudoRequest = z.infer<typeof createKudoRequestSchema>;

/**
 * Re-exported for server-side body_plain validation (Route Handler computes
 * body_plain from the sanitised body and re-checks length — FR-006 / FR-010).
 */
export const bodyPlainSchema = z
  .string()
  .min(1, { message: "body.required" })
  .max(MAX_BODY_PLAIN_CHARS, { message: "body.maxLength" });

export const listKudosParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  titleId: z.coerce.number().int().positive().optional(),
  hashtagId: z.coerce.number().int().positive().optional(),
});
export type ListKudosParams = z.infer<typeof listKudosParamsSchema>;

export const employeeSearchParamsSchema = z.object({
  q: z.string().trim().min(1, { message: "recipient.queryRequired" }),
  ignore_caller: z.coerce.boolean().default(true),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type EmployeeSearchParams = z.infer<typeof employeeSearchParamsSchema>;
