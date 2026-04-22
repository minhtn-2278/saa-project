"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useTranslations } from "next-intl";
import { ToolbarButton } from "./parts/ToolbarButton";
import { CommunityStandardsLink } from "./CommunityStandardsLink";
import { AddLinkPopover } from "./AddLinkPopover";
import { BoldIcon } from "@/components/ui/icons/BoldIcon";
import { ItalicIcon } from "@/components/ui/icons/ItalicIcon";
import { StrikethroughIcon } from "@/components/ui/icons/StrikethroughIcon";
import { BulletListIcon } from "@/components/ui/icons/BulletListIcon";
import { LinkIcon } from "@/components/ui/icons/LinkIcon";
import { QuoteIcon } from "@/components/ui/icons/QuoteIcon";

interface EditorToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
}

/**
 * Toolbar row (C) — 6 format buttons on the left + the "Tiêu chuẩn cộng đồng"
 * link cell on the right, all inside one `h-10 justify-between` row.
 * Design-style: h:40, flex row, justify-between.
 *
 * Button states track the editor via `editor.isActive(...)`. We subscribe
 * via `onSelectionUpdate` / `onTransaction` so `aria-pressed` stays in sync.
 */
export function EditorToolbar({
  editor,
  disabled,
}: EditorToolbarProps) {
  const t = useTranslations("kudos.writeKudo");
  const [, setTick] = useState(0);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkInitial, setLinkInitial] = useState<{ text: string; url: string }>({
    text: "",
    url: "",
  });

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

  /**
   * Open the Figma-style cream popover. Seeds the form from the current
   * selection: if the cursor is inside an existing link, prefill both the
   * href and the visible text so the user can edit either.
   */
  const onLink = () => {
    if (!editor) return;
    const prevHref =
      (editor.getAttributes("link").href as string | undefined) ?? "";
    const { from, to, empty } = editor.state.selection;
    const selectedText = empty ? "" : editor.state.doc.textBetween(from, to, " ");
    setLinkInitial({ text: selectedText, url: prevHref });
    setLinkOpen(true);
  };

  const handleLinkSave = ({ text, url }: { text: string; url: string }) => {
    if (!editor) {
      setLinkOpen(false);
      return;
    }
    const chain = editor.chain().focus();
    const { empty } = editor.state.selection;
    if (empty && text.length > 0) {
      // Cursor-only insertion with a text payload: write the text, mark it
      // as a link, then leave the cursor at the end.
      chain.insertContent({
        type: "text",
        text,
        marks: [{ type: "link", attrs: { href: url } }],
      });
    } else {
      // Either a range is selected, or no text override — keep the current
      // selection's text and just (re)apply the link mark on that range.
      chain.extendMarkRange("link").setLink({ href: url });
      if (!empty && text.length > 0) {
        chain.insertContent({
          type: "text",
          text,
          marks: [{ type: "link", attrs: { href: url } }],
        });
      }
    }
    chain.run();
    setLinkOpen(false);
  };

  const handleLinkCancel = () => setLinkOpen(false);

  return (
    <div className="relative flex flex-row items-center w-full h-10">
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
          disabled={disabled || !editor}
          onClick={() =>
            run(() => editor?.chain().focus().toggleBlockquote().run())
          }
        >
          <QuoteIcon size={20} />
        </ToolbarButton>
      </div>
      <CommunityStandardsLink />
      {linkOpen ? (
        <div className="absolute top-12 left-0 z-30">
          <AddLinkPopover
            initialText={linkInitial.text}
            initialUrl={linkInitial.url}
            onCancel={handleLinkCancel}
            onSave={handleLinkSave}
          />
        </div>
      ) : null}
    </div>
  );
}
