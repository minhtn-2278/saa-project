import { z } from "zod";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/constants/kudos";

/**
 * POST /api/uploads — request a signed upload URL for a single image.
 *
 * The client sends metadata; the server mints a signed URL that the client
 * then PUTs the file to. See plan.md § Upload flow, TR-003 / TR-008 / TR-011.
 */
export const createUploadRequestSchema = z.object({
  fileName: z.string().trim().min(1, { message: "image.fileNameRequired" }).max(255),
  mimeType: z.enum(ALLOWED_IMAGE_MIME_TYPES),
  byteSize: z
    .number()
    .int()
    .positive({ message: "image.invalid" })
    .max(MAX_IMAGE_SIZE_BYTES, { message: "image.invalid" }),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export type CreateUploadRequest = z.infer<typeof createUploadRequestSchema>;
