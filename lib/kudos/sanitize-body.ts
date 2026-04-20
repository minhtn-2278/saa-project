import type { ProseMirrorDoc, ProseMirrorNode, ProseMirrorMark } from "@/types/kudos";

/**
 * ProseMirror JSON sanitiser for Kudo bodies.
 *
 * Implements the server-side allow-list required by TR-006:
 *   - Allowed nodes:  doc, paragraph, text, blockquote, bullet_list, list_item,
 *                     hard_break, mention
 *   - Allowed marks:  bold, italic, strike, link (href allow-list)
 *   - Stripped:       script, event handlers, `javascript:` hrefs, `data:` hrefs,
 *                     external links that don't match the allow-list, unknown
 *                     node/mark types
 *   - Mention attrs:  `{ id: number, label: string }` — anything else ignored
 *   - Link hrefs:     must start with `/profile/` OR `https://saa.sun-asterisk.com/`
 *
 * The sanitiser also derives `body_plain` for search & preview (TR-006) —
 * returned alongside the sanitised body.
 */

const ALLOWED_NODE_TYPES = new Set([
  "doc",
  "paragraph",
  "text",
  "blockquote",
  "bullet_list",
  "list_item",
  "hard_break",
  "mention",
]);

const ALLOWED_MARK_TYPES = new Set([
  "bold",
  "italic",
  "strike",
  "link",
]);

/**
 * Allowed link href prefixes. Both internal Next.js routes and the project's
 * own production domain are allowed; anything else is stripped.
 */
const LINK_HREF_ALLOWLIST: Array<(href: string) => boolean> = [
  (href) => href.startsWith("/profile/"),
  (href) => href.startsWith("https://saa.sun-asterisk.com/"),
];

/**
 * Returns `true` if the href is safe to keep. Everything else (javascript:,
 * data:, mailto:, external domains) is stripped.
 */
function isAllowedLinkHref(raw: unknown): raw is string {
  if (typeof raw !== "string") return false;
  const href = raw.trim();
  if (!href) return false;
  const lower = href.toLowerCase();
  if (lower.startsWith("javascript:")) return false;
  if (lower.startsWith("data:")) return false;
  if (lower.startsWith("vbscript:")) return false;
  return LINK_HREF_ALLOWLIST.some((test) => test(href));
}

function sanitizeMark(mark: ProseMirrorMark): ProseMirrorMark | null {
  if (!ALLOWED_MARK_TYPES.has(mark.type)) return null;

  if (mark.type === "link") {
    const href = mark.attrs?.href;
    if (!isAllowedLinkHref(href)) return null;
    // Force rel + target on output; drop every other attr.
    return {
      type: "link",
      attrs: {
        href,
        target: "_blank",
        rel: "noopener noreferrer",
      },
    };
  }

  // Drop any attrs on non-link marks — none of them use attrs in our schema.
  return { type: mark.type };
}

function sanitizeMentionAttrs(
  attrs: Record<string, unknown> | undefined,
): { id: number; label: string } | null {
  if (!attrs) return null;
  // Strict: reject coerced strings. The client speaks JSON which always has
  // real number types for ids — anything else is suspicious.
  if (typeof attrs.id !== "number" || !Number.isInteger(attrs.id) || attrs.id <= 0) {
    return null;
  }
  const label = typeof attrs.label === "string" ? attrs.label : "";
  if (!label) return null;
  return { id: attrs.id, label };
}

function sanitizeNode(node: ProseMirrorNode): ProseMirrorNode | null {
  if (!node || typeof node !== "object" || !ALLOWED_NODE_TYPES.has(node.type)) {
    return null;
  }

  const out: ProseMirrorNode = { type: node.type };

  // Text nodes: keep the string, sanitise marks.
  if (node.type === "text") {
    if (typeof node.text !== "string") return null;
    out.text = node.text;
    if (node.marks?.length) {
      const marks = node.marks
        .map(sanitizeMark)
        .filter((m): m is ProseMirrorMark => m !== null);
      if (marks.length) out.marks = marks;
    }
    return out;
  }

  // Mention nodes: strict attrs schema.
  if (node.type === "mention") {
    const attrs = sanitizeMentionAttrs(node.attrs);
    if (!attrs) return null;
    return { type: "mention", attrs };
  }

  // hard_break has no content/attrs.
  if (node.type === "hard_break") {
    return { type: "hard_break" };
  }

  // Block-level nodes: recurse into content.
  if (node.content?.length) {
    const content = node.content
      .map(sanitizeNode)
      .filter((n): n is ProseMirrorNode => n !== null);
    if (content.length) out.content = content;
  }

  return out;
}

/**
 * Extract the plain-text representation of a sanitised ProseMirror doc.
 * Used for `body_plain` persistence + search.
 */
export function extractBodyPlain(doc: ProseMirrorDoc): string {
  const out: string[] = [];
  const walk = (node: ProseMirrorNode): void => {
    if (node.type === "text" && typeof node.text === "string") {
      out.push(node.text);
      return;
    }
    if (node.type === "mention") {
      const label = node.attrs?.label;
      if (typeof label === "string") {
        out.push(`@${label}`);
      }
      return;
    }
    if (node.type === "hard_break") {
      out.push("\n");
      return;
    }
    if (node.content?.length) {
      node.content.forEach(walk);
      // Paragraphs and list items are block-level — insert a newline after.
      if (
        node.type === "paragraph" ||
        node.type === "list_item" ||
        node.type === "blockquote"
      ) {
        out.push("\n");
      }
    }
  };
  doc.content?.forEach(walk);
  return out.join("").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Walk a sanitised ProseMirror document and collect the unique employee ids
 * of all mention nodes. Preserves first-seen order so the persisted
 * `kudo_mentions` rows match the order they appear in the body.
 *
 * Call this AFTER `sanitizeBody()` — the sanitiser drops malformed mention
 * attrs, so the caller can trust the returned ids.
 */
export function extractMentionIds(doc: ProseMirrorDoc): number[] {
  const ids: number[] = [];
  const seen = new Set<number>();
  const walk = (node: ProseMirrorNode): void => {
    if (node.type === "mention") {
      const id = node.attrs?.id;
      if (typeof id === "number" && Number.isInteger(id) && id > 0 && !seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
      return;
    }
    if (node.content?.length) node.content.forEach(walk);
  };
  doc.content?.forEach(walk);
  return ids;
}

/**
 * Sanitise a caller-supplied ProseMirror document.
 *
 * Returns a NEW document — input is never mutated. Unknown / disallowed
 * nodes and marks are silently stripped; the caller should re-check the
 * resulting `bodyPlain` length for required-field validation (TR-006).
 */
export function sanitizeBody(input: unknown): {
  body: ProseMirrorDoc;
  bodyPlain: string;
} {
  const doc = (input ?? {}) as Partial<ProseMirrorDoc>;
  if (doc.type !== "doc") {
    return { body: { type: "doc", content: [] }, bodyPlain: "" };
  }
  const content = Array.isArray(doc.content)
    ? doc.content
        .map((n) => sanitizeNode(n as ProseMirrorNode))
        .filter((n): n is ProseMirrorNode => n !== null)
    : [];
  const body: ProseMirrorDoc = { type: "doc", content };
  const bodyPlain = extractBodyPlain(body);
  return { body, bodyPlain };
}
