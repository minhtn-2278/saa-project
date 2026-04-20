"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState as useReactState,
} from "react";
import { useTranslations } from "next-intl";
import {
  EditorContent,
  ReactRenderer,
  useEditor,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import type { SuggestionProps as BaseSuggestionProps } from "@tiptap/suggestion";
import type { ProseMirrorDoc } from "@/types/kudos";
import type { EmployeePreview } from "./hooks/useKudoForm";

interface RichTextAreaProps {
  /** Controlled ProseMirror value. Pass the empty doc initially. */
  value: ProseMirrorDoc;
  onChange: (body: ProseMirrorDoc, bodyPlain: string) => void;
  onEditorReady?: (editor: Editor) => void;
  invalid?: boolean;
  disabled?: boolean;
  ariaLabelledBy?: string;
}

/**
 * Tiptap-backed ProseMirror editor for the Kudo body.
 * - StarterKit (sans OrderedList, Heading, Code, HR) + Link + Mention + Placeholder.
 * - Output: `editor.getJSON()` → ProseMirror doc; `editor.getText()` → bodyPlain.
 * - Mention suggestions come from `GET /api/employees/search?ignore_caller=false`.
 * - Spec TR-006 (allow-list) is enforced server-side; the editor is best-effort
 *   on the client.
 *
 * The caller owns the form state and surfaces format-toggle buttons via
 * the parent `EditorToolbar` — we expose the `Editor` instance through
 * `onEditorReady` for that purpose.
 */
export function RichTextArea({
  value,
  onChange,
  onEditorReady,
  invalid,
  disabled,
  ariaLabelledBy,
}: RichTextAreaProps) {
  const t = useTranslations("kudos.writeKudo");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        orderedList: false,
        heading: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({
        placeholder: t("fields.body.placeholder"),
      }),
      Mention.configure({
        HTMLAttributes: {
          class: "mention text-[#E46060] font-bold",
        },
        renderText({ options, node }) {
          return `${options.suggestion.char ?? "@"}${node.attrs.label ?? node.attrs.id}`;
        },
        suggestion: mentionSuggestion(),
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as ProseMirrorDoc, editor.getText());
    },
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": ariaLabelledBy ?? "",
        "aria-invalid": invalid ? "true" : "false",
        class:
          "prose prose-sm max-w-none outline-none min-h-[168px] [&_p]:m-0 [&_p]:min-h-[1.5rem]",
      },
    },
  });

  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <div
      className={`w-full min-h-[200px] px-6 py-4 bg-white border rounded-b-lg border-t-0 text-base leading-6 text-[#00101A] ${
        invalid ? "border-[#CF1322]" : "border-[#998C5F]"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <EditorContent editor={editor} />
    </div>
  );
}

// -----------------------------------------------------------------------------
// Mention suggestion plugin — custom popover (no tippy dependency)
// -----------------------------------------------------------------------------

interface ApiEmployee {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  department: string | null;
}

type SuggestionProps = BaseSuggestionProps<EmployeePreview> & {
  clientRect?: (() => DOMRect | null) | null;
};

function mentionSuggestion() {
  let abortController: AbortController | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    char: "@",
    items: async ({ query }: { query: string }): Promise<EmployeePreview[]> => {
      if (debounceTimer) clearTimeout(debounceTimer);
      abortController?.abort();
      if (!query || query.trim().length === 0) return [];

      return new Promise((resolve) => {
        debounceTimer = setTimeout(async () => {
          abortController = new AbortController();
          try {
            const params = new URLSearchParams({
              q: query,
              ignore_caller: "false",
              limit: "6",
            });
            const res = await fetch(`/api/employees/search?${params}`, {
              signal: abortController.signal,
            });
            if (!res.ok) return resolve([]);
            const json = (await res.json()) as { data: ApiEmployee[] };
            resolve(
              json.data.map((e) => ({
                id: e.id,
                fullName: e.fullName,
                avatarUrl: e.avatarUrl,
                department: e.department,
              })),
            );
          } catch (err) {
            if ((err as Error).name !== "AbortError") {
              console.error("mention suggest error", err);
            }
            resolve([]);
          }
        }, 200);
      });
    },
    render: () => {
      let component: ReactRenderer<MentionListRef, MentionListProps> | null = null;
      let host: HTMLDivElement | null = null;

      const positionHost = (rect: DOMRect | null | undefined) => {
        if (!host || !rect) return;
        host.style.position = "fixed";
        host.style.top = `${rect.bottom + 4}px`;
        host.style.left = `${rect.left}px`;
        host.style.zIndex = "70";
      };

      return {
        onStart: (props: SuggestionProps) => {
          host = document.createElement("div");
          document.body.appendChild(host);
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          });
          host.appendChild(component.element);
          const rect = props.clientRect?.();
          positionHost(rect);
        },
        onUpdate(props: SuggestionProps) {
          component?.updateProps(props);
          positionHost(props.clientRect?.());
        },
        onKeyDown(props: { event: KeyboardEvent }) {
          if (props.event.key === "Escape") {
            if (host) host.style.display = "none";
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },
        onExit() {
          component?.destroy();
          if (host?.parentNode) host.parentNode.removeChild(host);
          host = null;
        },
      };
    },
  };
}

// -----------------------------------------------------------------------------
// Mention list popover content
// -----------------------------------------------------------------------------

interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}
interface MentionListProps {
  items: EmployeePreview[];
  command: (attrs: { id: number; label: string }) => void;
}

const MentionList = forwardRef<MentionListRef, MentionListProps>(
  function MentionList(props, ref) {
    const [index, setIndex] = useReactState(0);

    const pick = (i: number) => {
      const it = props.items[i];
      if (!it) return;
      props.command({ id: it.id, label: it.fullName });
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (props.items.length === 0) return false;
        if (event.key === "ArrowUp") {
          setIndex((i) => (i + props.items.length - 1) % props.items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setIndex((i) => (i + 1) % props.items.length);
          return true;
        }
        if (event.key === "Enter") {
          pick(index);
          return true;
        }
        return false;
      },
    }));

    if (props.items.length === 0) {
      return (
        <div className="bg-white border border-[#998C5F] rounded-lg shadow-md p-3 text-sm text-[#999999] min-w-[200px]">
          Không có kết quả
        </div>
      );
    }

    return (
      <ul
        role="listbox"
        className="bg-white border border-[#998C5F] rounded-lg shadow-md py-1 min-w-[240px] max-w-[320px] max-h-60 overflow-auto"
      >
        {props.items.map((it, i) => (
          <li
            key={it.id}
            role="option"
            aria-selected={i === index}
            onMouseEnter={() => setIndex(i)}
            onMouseDown={(e) => {
              e.preventDefault();
              pick(i);
            }}
            className={`px-3 py-2 cursor-pointer text-[#00101A] ${
              i === index ? "bg-[#FFF8E1]" : "bg-white"
            }`}
          >
            <span className="font-bold">{it.fullName}</span>
            {it.department && (
              <span className="ml-2 text-xs text-[#999999]">{it.department}</span>
            )}
          </li>
        ))}
      </ul>
    );
  },
);
