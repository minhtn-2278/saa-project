import type {
  CreateKudoRequest,
  ListKudosParams,
  EmployeeSearchParams,
} from "@/lib/validations/kudos";
import type { CreateUploadRequest } from "@/lib/validations/uploads";

/**
 * TypeScript types for the Viết Kudo feature.
 * Request shapes are derived from Zod schemas so the contract is single-source.
 */

export type { CreateKudoRequest, ListKudosParams, EmployeeSearchParams };
export type { CreateUploadRequest };

// -----------------------------------------------------------------------------
// Domain rows (as returned from Supabase queries, pre-serialisation)
// -----------------------------------------------------------------------------

export interface EmployeeRow {
  id: number;
  email: string;
  full_name: string;
  employee_code: string | null;
  department: string | null;
  job_title: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  deleted_at: string | null;
}

export interface TitleRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  created_by: number | null;
  deleted_at: string | null;
}

export interface HashtagRow {
  id: number;
  label: string;
  slug: string;
  usage_count: number;
  created_by: number | null;
  deleted_at: string | null;
}

export interface UploadRow {
  id: number;
  owner_id: number;
  storage_key: string;
  mime_type: "image/jpeg" | "image/png" | "image/webp";
  byte_size: number;
  width: number | null;
  height: number | null;
  deleted_at: string | null;
}

export interface KudoRow {
  id: number;
  author_id: number;
  recipient_id: number;
  title_id: number;
  body: ProseMirrorDoc;
  body_plain: string;
  is_anonymous: boolean;
  anonymous_alias: string | null;
  status: "published" | "hidden" | "reported";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// -----------------------------------------------------------------------------
// ProseMirror JSON — loose typing. The sanitiser (lib/kudos/sanitize-body.ts)
// is the actual allow-list enforcer.
// -----------------------------------------------------------------------------

export interface ProseMirrorDoc {
  type: "doc";
  content?: ProseMirrorNode[];
}

export interface ProseMirrorNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ProseMirrorNode[];
  marks?: ProseMirrorMark[];
  text?: string;
}

export interface ProseMirrorMark {
  type: string;
  attrs?: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Public (serialised) Kudo payload returned by GET /api/kudos.
// Flat shape per TR-005 — no author object, no author_id, server-resolved names.
// -----------------------------------------------------------------------------

export interface PublicKudo {
  id: number;
  senderName: string;
  senderAvatarUrl: string | null;
  recipientId: number;
  recipientName: string;
  recipientAvatarUrl: string | null;
  title: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    sortOrder: number;
  };
  body: ProseMirrorDoc;
  bodyPlain: string;
  hashtags: Array<{
    id: number;
    label: string;
    slug: string;
    usageCount: number;
  }>;
  images: Array<{
    id: number;
    url: string;
    mimeType: UploadRow["mime_type"];
    byteSize: number;
    width: number | null;
    height: number | null;
    expiresAt: string;
  }>;
  mentions: Array<{
    id: number;
    fullName: string;
    email: string;
    employeeCode: string | null;
    department: string | null;
    jobTitle: string | null;
    avatarUrl: string | null;
  }>;
  isAnonymous: boolean;
  status: KudoRow["status"];
  createdAt: string;
}
