import type { ReactNode } from "react";
import type {
  ProseMirrorDoc,
  ProseMirrorMark,
  ProseMirrorNode,
} from "@/types/kudos";

interface KudoBodyProps {
  /**
   * Rich body as ProseMirror JSON. Produced by the Tiptap editor inside
   * `WriteKudoModal/RichTextArea.tsx`. When absent or empty we fall back to
   * the plain-text column.
   */
  body?: ProseMirrorDoc | null;
  /** Plain-text fallback for when `body` has no rich content (seed data, legacy rows). */
  bodyPlain: string;
  /** Line-clamp class applied to the outer wrapper. */
  className?: string;
}

/**
 * Renders the ProseMirror body surfaced by `PublicKudo.body` as React nodes,
 * preserving link marks, bold/italic/strike, mentions, bullet lists, and
 * blockquotes.
 *
 * The Live-board cards (`KudoPost`, `HighlightCard`) used to render
 * `kudo.bodyPlain`, which is a `editor.getText()` dump — it strips all marks,
 * so `<a href=…>` links added via the Viết Kudo "Add link" popover were
 * invisible on the feed. This component walks the rich doc instead.
 *
 * Keep the renderer deliberately small: it supports only the nodes / marks
 * enabled by the Tiptap extension list in `RichTextArea.tsx`. Unknown types
 * degrade to their text content (or nothing) so malformed input never throws.
 */
export function KudoBody({ body, bodyPlain, className }: KudoBodyProps) {
  const hasRich =
    body && Array.isArray(body.content) && body.content.length > 0;

  if (!hasRich) {
    return (
      <p
        className={
          className ??
          "text-base md:text-lg font-bold leading-relaxed whitespace-pre-wrap"
        }
      >
        {bodyPlain}
      </p>
    );
  }

  return (
    <div className={className ?? "text-base md:text-lg font-bold leading-relaxed"}>
      {renderNodes(body.content ?? [])}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Internals
// -----------------------------------------------------------------------------

function renderNodes(nodes: ProseMirrorNode[]): ReactNode {
  return nodes.map((node, idx) => renderNode(node, idx));
}

function renderNode(node: ProseMirrorNode, key: number | string): ReactNode {
  switch (node.type) {
    case "paragraph": {
      const children = node.content ? renderNodes(node.content) : null;
      // An empty paragraph should still reserve a visual line break.
      return (
        <p key={key} className="min-h-[1em]">
          {children}
        </p>
      );
    }
    case "hardBreak":
      return <br key={key} />;
    case "bulletList":
      return (
        <ul key={key} className="list-disc pl-6 my-2 space-y-1">
          {node.content ? renderNodes(node.content) : null}
        </ul>
      );
    case "listItem":
      return (
        <li key={key}>
          {node.content ? renderNodes(node.content) : null}
        </li>
      );
    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-l-4 border-[rgba(0,16,26,0.25)] pl-4 my-2 italic"
        >
          {node.content ? renderNodes(node.content) : null}
        </blockquote>
      );
    case "mention": {
      const attrs = (node.attrs ?? {}) as { id?: unknown; label?: unknown };
      const label =
        typeof attrs.label === "string" && attrs.label.length > 0
          ? attrs.label
          : String(attrs.id ?? "");
      return (
        <span key={key} className="mention text-[#E46060] font-bold">
          @{label}
        </span>
      );
    }
    case "text":
      return renderText(node, key);
    default:
      return null;
  }
}

function renderText(
  node: ProseMirrorNode,
  key: number | string,
): ReactNode {
  const text = node.text ?? "";
  if (text.length === 0) return null;

  const marks = node.marks ?? [];
  const linkMark = marks.find((m) => m.type === "link");

  let wrapped: ReactNode = text;

  for (const mark of marks) {
    if (mark.type === "link") continue; // handled outside so anchor is the outermost element
    wrapped = applyMark(wrapped, mark);
  }

  if (linkMark) {
    const href = (linkMark.attrs?.href as string | undefined) ?? "";
    // Minimal guard: drop obviously-unsafe schemes (javascript:, data:).
    const safeHref = isSafeHref(href) ? href : "#";
    return (
      <a
        key={key}
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 text-[#0B5FFF] hover:opacity-80"
      >
        {wrapped}
      </a>
    );
  }

  // No link — still need a keyed wrapper if there were other marks, else raw.
  return <span key={key}>{wrapped}</span>;
}

function applyMark(children: ReactNode, mark: ProseMirrorMark): ReactNode {
  switch (mark.type) {
    case "bold":
      return <strong>{children}</strong>;
    case "italic":
      return <em>{children}</em>;
    case "strike":
      return <s>{children}</s>;
    case "underline":
      return <u>{children}</u>;
    case "code":
      return <code>{children}</code>;
    default:
      return children;
  }
}

function isSafeHref(href: string): boolean {
  const trimmed = href.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.startsWith("/")) return true;
  if (trimmed.startsWith("#")) return true;
  return /^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed);
}
