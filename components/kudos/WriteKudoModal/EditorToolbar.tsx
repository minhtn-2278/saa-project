"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useTranslations } from "next-intl";
import { ToolbarButton } from "./parts/ToolbarButton";
import { BoldIcon } from "@/components/ui/icons/BoldIcon";
import { ItalicIcon } from "@/components/ui/icons/ItalicIcon";
import { StrikethroughIcon } from "@/components/ui/icons/StrikethroughIcon";
import { BulletListIcon } from "@/components/ui/icons/BulletListIcon";
import { LinkIcon } from "@/components/ui/icons/LinkIcon";
import { QuoteIcon } from "@/components/ui/icons/QuoteIcon";

interface EditorToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
  /** Right-aligned slot, typically the "Tiêu chuẩn cộng đồng" link. */
  rightSlot?: React.ReactNode;
}

/**
 * Toolbar row (C) — 6 format buttons left, optional link right, space-between.
 * Design-style: h:40, flex row, justify-between.
 *
 * Button states track the editor via `editor.isActive(...)`. We subscribe
 * via `onSelectionUpdate` / `onTransaction` so `aria-pressed` stays in sync.
 */
export function EditorToolbar({
  editor,
  disabled,
  rightSlot,
}: EditorToolbarProps) {
  const t = useTranslations("kudos.writeKudo");
  const [, setTick] = useState(0);

  // Re-render on every editor state change so isActive() is fresh.
  useEffect(() => {
    if (!editor) return;
    const update = () => setTick((n) => n + 1);
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  const isActive = (name: string, attrs?: Record<string, unknown>) =>
    editor?.isActive(name, attrs) ?? false;

  const run = (fn: () => boolean | void) => {
    if (!editor) return;
    fn();
  };

  const onLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL (https://saa.sun-asterisk.com/... or /profile/...)", prev ?? "");
    if (url === null) return; // cancelled
    if (url.trim().length === 0) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-row justify-between items-center w-full h-10">
      <div
        role="group"
        aria-label={t("title")}
        className="flex flex-row items-center"
      >
        <ToolbarButton
          active={isActive("bold")}
          ariaLabel="Bold"
          position="first"
          disabled={disabled || !editor}
          onClick={() => run(() => editor?.chain().focus().toggleBold().run())}
        >
          <BoldIcon size={20} />
        </ToolbarButton>
        <ToolbarButton
          active={isActive("italic")}
          ariaLabel="Italic"
          disabled={disabled || !editor}
          onClick={() => run(() => editor?.chain().focus().toggleItalic().run())}
        >
          <ItalicIcon size={20} />
        </ToolbarButton>
        <ToolbarButton
          active={isActive("strike")}
          ariaLabel="Strikethrough"
          disabled={disabled || !editor}
          onClick={() => run(() => editor?.chain().focus().toggleStrike().run())}
        >
          <StrikethroughIcon size={20} />
        </ToolbarButton>
        <ToolbarButton
          active={isActive("bulletList")}
          ariaLabel="Bulleted list"
          disabled={disabled || !editor}
          onClick={() =>
            run(() => editor?.chain().focus().toggleBulletList().run())
          }
        >
          <BulletListIcon size={20} />
        </ToolbarButton>
        <ToolbarButton
          active={isActive("link")}
          ariaLabel="Link"
          disabled={disabled || !editor}
          onClick={onLink}
        >
          <LinkIcon size={20} />
        </ToolbarButton>
        <ToolbarButton
          active={isActive("blockquote")}
          ariaLabel="Blockquote"
          position="last"
          disabled={disabled || !editor}
          onClick={() =>
            run(() => editor?.chain().focus().toggleBlockquote().run())
          }
        >
          <QuoteIcon size={20} />
        </ToolbarButton>
      </div>
      {rightSlot && <div className="ml-auto">{rightSlot}</div>}
    </div>
  );
}
