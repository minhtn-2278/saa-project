"use client";

import { useCallback, useMemo, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ModalShell } from "./ModalShell";
import { RecipientField } from "./RecipientField";
import { TitleField } from "./TitleField";
import { HashtagPicker } from "./HashtagPicker";
import { ActionBar } from "./ActionBar";
import { CancelConfirmDialog } from "./CancelConfirmDialog";
import { EditorToolbar } from "./EditorToolbar";
import { uploadImages } from "./uploadImages";
import { RichTextArea } from "./RichTextArea";
import { MentionHintRow } from "./MentionHintRow";
import { ImageUploader } from "./ImageUploader";
import { AnonymousCheckbox } from "./AnonymousCheckbox";
import { AnonymousAliasInput } from "./AnonymousAliasInput";
import { FieldLabel } from "./parts/FieldLabel";
import { useErrorResolver } from "./parts/resolveError";
import {
  type HashtagPreview,
  type KudoFormState,
  type TitlePreview,
  useKudoForm,
} from "./hooks/useKudoForm";
import { clearDraft, useDraftSync } from "./hooks/useDraftSync";

export interface WriteKudoModalProps {
  open: boolean;
  onClose: () => void;
  titles: TitlePreview[];
  topHashtags: HashtagPreview[];
}

interface ServerValidationErrors {
  recipientId?: string[];
  titleId?: string[];
  titleName?: string[];
  body?: string[];
  hashtags?: string[];
  imageIds?: string[];
  anonymousAlias?: string[];
  _?: string[];
}

/**
 * Top-level client island for the Write-Kudo modal.
 *
 * Phase 3 (US1 + US4): recipient + Danh hiệu (existing) + plain body +
 * 1..5 hashtags + Hủy/Gửi.
 * Phase 4 (US2): ProseMirror body via Tiptap + @mention + 0..5 images.
 */
export function WriteKudoModal({
  open,
  onClose,
  titles,
  topHashtags,
}: WriteKudoModalProps) {
  const t = useTranslations("kudos.writeKudo");
  const tErr = useTranslations("kudos.writeKudo.errors");
  const resolveError = useErrorResolver();

  const form = useKudoForm();
  const {
    state,
    isValid,
    setRecipient,
    setTitle,
    setBody,
    addHashtag,
    removeHashtag,
    removeHashtagByLabel,
    addImage,
    removeImageByFile,
    restore,
    reset,
    dispatch,
  } = form;

  const [serverErrors, setServerErrors] = useState<ServerValidationErrors>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);

  useDraftSync(
    state,
    useCallback((restored) => restore(restored), [restore]),
    open,
  );

  const closeAndReset = useCallback(() => {
    // Single-shot close: wipe the persisted draft then fire `onClose()`.
    // We intentionally skip `reset()` / `setServerErrors({}) /
    // `setShowValidation(false)` — the modal is about to unmount, so every
    // piece of in-memory state (reducer, useState, editor instance) is
    // discarded automatically. Removing those calls collapses the close
    // sequence from "state reset → render → URL change → render → unmount"
    // into "clearDraft → URL change → unmount".
    clearDraft();
    onClose();
  }, [onClose]);

  const handleCancelRequest = useCallback(() => {
    if (state.isDirty) {
      setShowCancelConfirm(true);
    } else {
      closeAndReset();
    }
  }, [state.isDirty, closeAndReset]);

  const fieldErrors = useMemo(() => {
    const errors: Record<string, string | null> = {
      recipient: null,
      title: null,
      body: null,
      hashtags: null,
      images: null,
      alias: null,
    };
    if (showValidation) {
      if (!state.recipient) errors.recipient = "recipient.required";
      if (!state.title) errors.title = "title.required";
      if (state.bodyPlain.trim().length === 0) errors.body = "body.required";
      if (state.hashtags.length === 0) errors.hashtags = "hashtag.required";
    }
    if (serverErrors.recipientId?.[0])
      errors.recipient = serverErrors.recipientId[0];
    if (serverErrors.titleId?.[0]) errors.title = serverErrors.titleId[0];
    if (serverErrors.titleName?.[0]) errors.title = serverErrors.titleName[0];
    if (serverErrors.body?.[0]) errors.body = serverErrors.body[0];
    if (serverErrors.hashtags?.[0]) errors.hashtags = serverErrors.hashtags[0];
    if (serverErrors.imageIds?.[0]) errors.images = serverErrors.imageIds[0];
    if (serverErrors.anonymousAlias?.[0])
      errors.alias = serverErrors.anonymousAlias[0];
    return errors;
  }, [showValidation, state, serverErrors]);

  const doSubmit = useCallback(async () => {
    setShowValidation(true);
    if (!isValid) return;

    form.dispatch({ type: "SUBMIT_START" });
    setServerErrors({});

    // Step 1: upload every picked image and collect the `uploads.id`s.
    // Uploads happen here (not on file pick) so a cancelled draft leaves
    // no storage artefacts. Failures abort the submit — orphans from
    // partial batches are cleaned up by the GC job.
    let imageIds: number[];
    try {
      imageIds = await uploadImages(state.images.map((img) => img.file));
    } catch (err) {
      console.error("image upload failed", err);
      form.dispatch({
        type: "SUBMIT_ERROR",
        message: tErr("image.uploadFailed"),
      });
      toast.error(tErr("image.uploadFailed"));
      return;
    }

    const title = state.title!;
    const aliasTrim = state.anonymousAlias.trim();
    const payload: Record<string, unknown> = {
      recipientId: state.recipient!.id,
      body: state.body,
      hashtags: state.hashtags.map((h) =>
        h.pending ? { label: h.label } : { id: h.id },
      ),
      imageIds,
      isAnonymous: state.isAnonymous,
    };
    if (title.pending) payload.titleName = title.name;
    else payload.titleId = title.id;
    if (state.isAnonymous && aliasTrim.length > 0) {
      payload.anonymousAlias = aliasTrim;
    }

    try {
      const res = await fetch("/api/kudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let details: ServerValidationErrors | undefined;
        try {
          const json = await res.json();
          details = json.error?.details;
        } catch {
          /* ignore */
        }
        if (res.status === 422 && details) {
          setServerErrors(details);
          form.dispatch({
            type: "SUBMIT_ERROR",
            message: tErr("generic.timeout"),
          });
          return;
        }
        form.dispatch({
          type: "SUBMIT_ERROR",
          message: t("toasts.failure"),
        });
        toast.error(t("toasts.failure"));
        return;
      }
      // Single-shot close after success: `clearDraft` wipes sessionStorage,
      // toast announces success, `onClose()` triggers the URL change that
      // unmounts the modal. No state resets needed — the component is about
      // to unmount, every piece of in-memory state (reducer, useState,
      // editor instance) is discarded automatically.
      clearDraft();
      toast.success(t("toasts.success"));
      onClose();
    } catch (err) {
      console.error("POST /api/kudos failed", err);
      form.dispatch({
        type: "SUBMIT_ERROR",
        message: t("toasts.failure"),
      });
      toast.error(t("toasts.failure"));
    }
  }, [isValid, state, form, t, tErr, onClose]);

  return (
    <>
      <ModalShell
        open={open}
        onOpenChange={(next) => {
          if (!next) handleCancelRequest();
        }}
        titleText={t("title")}
        onInteractOutside={(e) => {
          if (state.isDirty) {
            e.preventDefault();
            setShowCancelConfirm(true);
          }
        }}
      >
        <RecipientField
          value={state.recipient}
          onChange={setRecipient}
          error={fieldErrors.recipient}
          disabled={state.isSubmitting}
        />

        <TitleField
          titles={titles}
          value={state.title}
          onChange={setTitle}
          error={fieldErrors.title}
          disabled={state.isSubmitting}
        />

        <div className="flex flex-col w-full">
          <FieldLabel required>{t("fields.body.label")}</FieldLabel>
          <div className="mt-2">
            <EditorToolbar editor={editor} disabled={state.isSubmitting} />
            <RichTextArea
              value={state.body}
              onChange={setBody}
              onEditorReady={setEditor}
              invalid={!!fieldErrors.body}
              disabled={state.isSubmitting}
            />
          </div>
          <div className="mt-2">
            <MentionHintRow />
          </div>
          {fieldErrors.body && (
            <p role="alert" className="mt-1 text-sm text-[#CF1322]">
              {resolveError(fieldErrors.body)}
            </p>
          )}
        </div>

        <HashtagPicker
          topHashtags={topHashtags}
          value={state.hashtags}
          onAdd={addHashtag}
          onRemove={removeHashtag}
          onRemoveByLabel={removeHashtagByLabel}
          error={fieldErrors.hashtags}
          disabled={state.isSubmitting}
        />

        <ImageUploader
          images={state.images}
          onAdd={addImage}
          onRemoveByFile={removeImageByFile}
          disabled={state.isSubmitting}
        />
        {fieldErrors.images && (
          <p role="alert" className="text-sm text-[#CF1322]">
            {resolveError(fieldErrors.images)}
          </p>
        )}

        <AnonymousCheckbox
          checked={state.isAnonymous}
          onChange={(next) =>
            dispatch({ type: "SET_ANONYMOUS", isAnonymous: next })
          }
          disabled={state.isSubmitting}
        />
        <AnonymousAliasInput
          visible={state.isAnonymous}
          value={state.anonymousAlias}
          onChange={(next) => dispatch({ type: "SET_ALIAS", alias: next })}
          error={fieldErrors.alias}
          disabled={state.isSubmitting}
        />

        {/* Form-level error summary — always rendered so screen readers
            pick up the live-region update; content is empty when no error.
            `aria-atomic` makes the update announce the full text, not just
            the diff. T134 (Phase 6 — a11y polish). */}
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={`text-sm text-[#CF1322] ${state.submitError ? "" : "sr-only"}`}
        >
          {state.submitError ?? ""}
        </p>

        <ActionBar
          canSubmit={isValid}
          submitting={state.isSubmitting}
          onCancel={handleCancelRequest}
          onSubmit={doSubmit}
        />
      </ModalShell>

      <CancelConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        onConfirm={() => {
          setShowCancelConfirm(false);
          // `closeAndReset` already fires `onClose()` → Mount's `handleClose`
          // which calls `router.replace` to strip `?write=kudo`. A second
          // `router.replace(pathname)` here kicked off an extra navigation
          // (useSearchParams re-fires → Mount re-renders → WriteKudoModal
          // gets a new onClose prop → one more render right before unmount).
          closeAndReset();
        }}
      />
    </>
  );
}

export type { KudoFormState };
