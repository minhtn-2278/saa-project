import type {
  EmployeeRow,
  HashtagRow,
  KudoRow,
  PublicKudo,
  TitleRow,
} from "@/types/kudos";

/**
 * Public display name fallback for anonymous Kudos whose author did NOT
 * provide a custom alias. Kept in sync with the i18n key
 * `kudos.writeKudo.fields.anonymous.aliasFallback` (vi.json) but emitted as
 * a literal so unauthenticated callers get a stable default — the client may
 * localise it on the render side if needed.
 */
export const ANONYMOUS_SENDER_FALLBACK = "Ẩn danh";

export interface SerializeKudoDeps {
  /**
   * Map<employees.id, EmployeeRow> containing at minimum the author and
   * recipient rows. Additional rows for mentions may be included. Callers
   * are responsible for building this map (typically via a batched
   * `SELECT id, full_name, avatar_url, ... FROM employees WHERE id = ANY(?)`).
   */
  employeesById: Map<number, EmployeeRow>;

  /** Resolved title row for `kudo.title_id`. */
  title: TitleRow;

  /** Hashtag rows joined through `kudo_hashtags`. */
  hashtags: HashtagRow[];

  /**
   * Images already-signed and mapped to the public `PublicKudo.images[]`
   * shape. The signing step happens in the Route Handler (lib/supabase
   * Storage client) because signed URL generation is async and network-bound;
   * the pure serializer stays sync.
   */
  images: PublicKudo["images"];

  /** Resolved mention employee rows (for rendering profile links). */
  mentionEmployeeIds: number[];
}

/**
 * Serialise a Kudo DB row into the public API shape.
 *
 * **Anonymity masking (TR-005)** happens here:
 *   - When `is_anonymous = true` AND `anonymous_alias` is non-null → `senderName`
 *     is the alias.
 *   - When `is_anonymous = true` AND `anonymous_alias` is null/empty → `senderName`
 *     is `ANONYMOUS_SENDER_FALLBACK`.
 *   - When `is_anonymous = false` → `senderName` is the author's `full_name`.
 *   - `senderAvatarUrl` is always `null` when anonymous.
 *   - `author_id` is NEVER included in the output.
 *
 * The function is pure — side-effect free, sync, and easy to unit-test.
 */
export function serializeKudo(
  kudo: KudoRow,
  deps: SerializeKudoDeps,
): PublicKudo {
  const { employeesById, title, hashtags, images, mentionEmployeeIds } = deps;

  const author = employeesById.get(kudo.author_id);
  const recipient = employeesById.get(kudo.recipient_id);
  if (!recipient) {
    throw new Error(
      `serializeKudo: recipient employee ${kudo.recipient_id} missing from employeesById`,
    );
  }

  // Resolve sender (masked when anonymous).
  let senderName: string;
  let senderAvatarUrl: string | null;
  if (kudo.is_anonymous) {
    const alias = kudo.anonymous_alias?.trim() ?? "";
    senderName = alias.length > 0 ? alias : ANONYMOUS_SENDER_FALLBACK;
    senderAvatarUrl = null;
  } else {
    if (!author) {
      throw new Error(
        `serializeKudo: author employee ${kudo.author_id} missing from employeesById`,
      );
    }
    senderName = author.full_name;
    senderAvatarUrl = author.avatar_url;
  }

  const mentions = mentionEmployeeIds
    .map((id) => employeesById.get(id))
    .filter((e): e is EmployeeRow => e !== undefined)
    .map((e) => ({
      id: e.id,
      fullName: e.full_name,
      email: e.email,
      employeeCode: e.employee_code,
      department: e.department,
      jobTitle: e.job_title,
      avatarUrl: e.avatar_url,
    }));

  return {
    id: kudo.id,
    senderName,
    senderAvatarUrl,
    recipientId: recipient.id,
    recipientName: recipient.full_name,
    recipientAvatarUrl: recipient.avatar_url,
    title: {
      id: title.id,
      name: title.name,
      slug: title.slug,
      description: title.description,
      icon: title.icon,
      sortOrder: title.sort_order,
    },
    body: kudo.body,
    bodyPlain: kudo.body_plain,
    hashtags: hashtags.map((h) => ({
      id: h.id,
      label: h.label,
      slug: h.slug,
      usageCount: h.usage_count,
    })),
    images,
    mentions,
    isAnonymous: kudo.is_anonymous,
    status: kudo.status,
    createdAt: kudo.created_at,
  };
}
