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
  /**
   * Live-board migration (plan.md § Phase 1 T010): the legacy free-text
   * `department` column is being replaced with `department_id BIGINT
   * REFERENCES departments(id)`. Both fields are declared here during the
   * transition — the read site reads `department_id` first and falls back to
   * `department` until the migration applies in every environment.
   * `serialize-kudo.ts` joins to `departments` via `department_id` and exposes
   * the resolved code as `employees.department` in the public payload.
   */
  department: string | null;
  department_id: number | null;
  job_title: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  deleted_at: string | null;
}

// -----------------------------------------------------------------------------
// Live board — new master-data rows
// -----------------------------------------------------------------------------

export interface DepartmentRow {
  id: number;
  code: string;
  name: string | null;
  parent_id: number | null;
  sort_order: number;
  deleted_at: string | null;
}

export interface KudoHeartRow {
  kudo_id: number;
  employee_id: number;
  created_at: string;
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

  // -- Live board heart state (plan.md § T014). Optional on writes from
  //    server-to-server contexts without a caller identity; always populated
  //    on API responses that flow through a Route Handler.
  heartCount?: number;
  heartedByMe?: boolean;
  canHeart?: boolean; // false ⇔ caller is the author
}

// -----------------------------------------------------------------------------
// Live board — API response shapes
// -----------------------------------------------------------------------------

/**
 * Cursor-pagination meta for GET /api/kudos when the request used `cursor`.
 * The cursor is an opaque string encoding (created_at, id) — see
 * `lib/kudos/cursor.ts` for the codec (plan.md § T017, Q-P1).
 */
export interface CursorPaginationMeta {
  limit: number;
  nextCursor: string | null;
  // Offset-mode companion fields — populated ONLY when the request used `page`.
  page?: number;
  total?: number;
  totalPages?: number;
}

/** GET /api/kudos/highlight → { data: PublicKudo[] } — up to 5 items, no pagination. */
export interface HighlightKudoListResponse {
  data: PublicKudo[];
}

/** POST | DELETE /api/kudos/{id}/like response. Idempotent: reflects post-op state. */
export interface LikeResponse {
  data: {
    kudoId: number;
    heartCount: number;
    /** `true` after POST, `false` after DELETE. */
    heartedByMe: boolean;
  };
}

/** GET /api/departments → flat list for the Phòng ban filter dropdown. */
export interface DepartmentListResponse {
  data: Array<{
    id: number;
    code: string;
    name: string | null;
    parentId: number | null;
    sortOrder: number;
  }>;
}

/**
 * GET /api/me/stats — sidebar (D.1) stats for the authenticated caller.
 * `boxesOpened` / `boxesUnopened` are hard-coded to 0 this release —
 * the `secret_boxes` table is deferred (plan.md § Out-of-scope).
 */
export interface MyStatsResponse {
  data: {
    kudosReceived: number;
    kudosSent: number;
    heartsReceived: number;
    boxesOpened: 0;
    boxesUnopened: 0;
  };
}

/**
 * GET /api/spotlight — top 20 recipients by `kudos_count` in the rolling
 * last 24 hours (plan.md § Q-P6). The event-wide `total` is NOT 24h-scoped.
 */
export interface SpotlightNode {
  /** `employees.id` of the recipient — stable identity across redraws. */
  id: number;
  name: string;
  avatarUrl: string | null;
  /** Kudos received by this recipient within the last 24h. */
  kudosCount: number;
  /** Timestamp of their most-recent Kudo in the 24h window. */
  lastReceivedAt: string;
  /** Normalised canvas position 0..1. */
  x: number;
  y: number;
}

export interface SpotlightResponse {
  data: {
    /** Event-wide COUNT(*) of published Kudos — drives the big B.7.1 label. */
    total: number;
    /** Up to 20 top-recipient nodes. Empty during quiet 24h windows. */
    nodes: SpotlightNode[];
    /** Opaque version tag `{eventDayIso}:{bucket5min}`. */
    layoutVersion: string;
    cachedAt: string;
  };
}

// -----------------------------------------------------------------------------
// Live board — client-side realtime channel event payloads
// -----------------------------------------------------------------------------

/**
 * Payload emitted by `lib/spotlight/realtime-channel.ts` when a new Kudo lands.
 * Used by `SpotlightBoard` to debounce the total-count tick and append to the
 * recent-receiver log. Intentionally narrow — no sensitive columns.
 */
export interface KudoInsertEvent {
  kudoId: number;
  recipientId: number;
  recipientName: string;
  recipientAvatarUrl: string | null;
  createdAt: string;
}
