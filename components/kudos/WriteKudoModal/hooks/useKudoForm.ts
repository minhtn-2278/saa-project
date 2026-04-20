"use client";

import { useCallback, useReducer } from "react";
import {
  MAX_ANONYMOUS_ALIAS_LENGTH,
  MAX_HASHTAGS_PER_KUDO,
  MAX_IMAGES_PER_KUDO,
} from "@/lib/constants/kudos";
import type { ProseMirrorDoc } from "@/types/kudos";

/**
 * Draft-state models.
 *
 * Phase 3 (MVP) used a plain-string `body`. Phase 4 (US2) upgrades it to a
 * ProseMirror JSON doc alongside a derived `bodyPlain` + an ordered list
 * of image drafts. Phase 5 will add pending titles/hashtags + anonymity.
 */

export interface EmployeePreview {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  department: string | null;
}

export interface TitlePreview {
  /** `-1` when `pending` is true; otherwise the existing `titles.id`. */
  id: number;
  name: string;
  /** `true` when this title is an inline-create pending persist (US3 / FR-006a). */
  pending?: boolean;
}

export interface HashtagPreview {
  /** `-1` when `pending` is true; otherwise the existing `hashtags.id`. */
  id: number;
  label: string;
  /** `true` when this hashtag is an inline-create pending persist (US3 / FR-006). */
  pending?: boolean;
}

/**
 * A single image in the draft.
 *
 * Images are **not** uploaded while the modal is open — they live as local
 * `File` refs with a `blob:` preview URL until the user hits Gửi. At submit
 * time the form handler walks this list, uploads each file, and attaches
 * the resulting upload ids to the kudo. This matches the user's preference
 * for one atomic network phase on submit.
 */
export interface ImageDraft {
  /** Local File reference — the bytes to upload at submit time. */
  file: File;
  /** `blob:` URL for preview. */
  previewUrl: string;
}

/** Empty doc helper used as `body` init. */
export function emptyDoc(): ProseMirrorDoc {
  return { type: "doc", content: [{ type: "paragraph" }] };
}

export interface KudoFormState {
  recipient: EmployeePreview | null;
  title: TitlePreview | null;
  body: ProseMirrorDoc;
  bodyPlain: string;
  hashtags: HashtagPreview[];
  images: ImageDraft[];
  isAnonymous: boolean;
  anonymousAlias: string;
  isDirty: boolean;
  isSubmitting: boolean;
  submitError: string | null;
}

export type KudoFormAction =
  | { type: "SET_RECIPIENT"; recipient: EmployeePreview | null }
  | { type: "SET_TITLE"; title: TitlePreview | null }
  | { type: "SET_BODY"; body: ProseMirrorDoc; bodyPlain: string }
  | { type: "ADD_HASHTAG"; hashtag: HashtagPreview }
  | { type: "REMOVE_HASHTAG"; id: number }
  | { type: "REMOVE_HASHTAG_BY_LABEL"; label: string }
  | { type: "ADD_IMAGE"; image: ImageDraft }
  | { type: "REMOVE_IMAGE_BY_FILE"; file: File }
  | { type: "SET_ANONYMOUS"; isAnonymous: boolean }
  | { type: "SET_ALIAS"; alias: string }
  | { type: "SUBMIT_START" }
  | { type: "SUBMIT_ERROR"; message: string }
  | { type: "SUBMIT_SUCCESS" }
  | { type: "RESTORE"; state: Partial<KudoFormState> }
  | { type: "RESET" };

export const initialState: KudoFormState = {
  recipient: null,
  title: null,
  body: emptyDoc(),
  bodyPlain: "",
  hashtags: [],
  images: [],
  isAnonymous: false,
  anonymousAlias: "",
  isDirty: false,
  isSubmitting: false,
  submitError: null,
};

function reducer(state: KudoFormState, action: KudoFormAction): KudoFormState {
  switch (action.type) {
    case "SET_RECIPIENT":
      return { ...state, recipient: action.recipient, isDirty: true };
    case "SET_TITLE":
      return { ...state, title: action.title, isDirty: true };
    case "SET_BODY":
      return {
        ...state,
        body: action.body,
        bodyPlain: action.bodyPlain,
        isDirty: true,
      };
    case "ADD_HASHTAG": {
      if (state.hashtags.length >= MAX_HASHTAGS_PER_KUDO) return state;
      const { hashtag } = action;
      // Dedup: id match for existing, case-insensitive label match for pending.
      const normLabel = hashtag.label.trim().toLowerCase();
      const dup = state.hashtags.some((h) =>
        hashtag.pending || h.pending
          ? h.label.trim().toLowerCase() === normLabel
          : h.id === hashtag.id,
      );
      if (dup) return state;
      return {
        ...state,
        hashtags: [...state.hashtags, hashtag],
        isDirty: true,
      };
    }
    case "REMOVE_HASHTAG":
      return {
        ...state,
        hashtags: state.hashtags.filter((h) => h.pending || h.id !== action.id),
        isDirty: true,
      };
    case "REMOVE_HASHTAG_BY_LABEL": {
      const key = action.label.trim().toLowerCase();
      return {
        ...state,
        hashtags: state.hashtags.filter(
          (h) => h.label.trim().toLowerCase() !== key,
        ),
        isDirty: true,
      };
    }
    case "ADD_IMAGE": {
      if (state.images.length >= MAX_IMAGES_PER_KUDO) return state;
      return {
        ...state,
        images: [...state.images, action.image],
        isDirty: true,
      };
    }
    case "REMOVE_IMAGE_BY_FILE":
      return {
        ...state,
        images: state.images.filter((img) => img.file !== action.file),
        isDirty: true,
      };
    case "SET_ANONYMOUS":
      return {
        ...state,
        isAnonymous: action.isAnonymous,
        anonymousAlias: action.isAnonymous ? state.anonymousAlias : "",
        isDirty: true,
      };
    case "SET_ALIAS":
      return { ...state, anonymousAlias: action.alias, isDirty: true };
    case "SUBMIT_START":
      return { ...state, isSubmitting: true, submitError: null };
    case "SUBMIT_ERROR":
      return { ...state, isSubmitting: false, submitError: action.message };
    case "SUBMIT_SUCCESS":
      return { ...initialState, body: emptyDoc() };
    case "RESTORE":
      return { ...state, ...action.state, isDirty: false };
    case "RESET":
      return { ...initialState, body: emptyDoc() };
    default:
      return state;
  }
}

/**
 * Form state + action dispatchers + cheap derived validation flags.
 * The form component resolves i18n error keys and exposes them as
 * `aria-describedby` labels; validity flags here are just booleans.
 */
export function useKudoForm(override?: Partial<KudoFormState>) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    body: emptyDoc(),
    ...override,
  });

  // Codepoint-aware length (surrogate pairs = 1) to match server-side trim rule.
  const aliasOver =
    state.isAnonymous &&
    [...state.anonymousAlias].length > MAX_ANONYMOUS_ALIAS_LENGTH;

  const isValid =
    state.recipient != null &&
    state.title != null &&
    state.bodyPlain.trim().length > 0 &&
    state.hashtags.length >= 1 &&
    state.hashtags.length <= MAX_HASHTAGS_PER_KUDO &&
    state.images.length <= MAX_IMAGES_PER_KUDO &&
    !aliasOver;

  const setRecipient = useCallback(
    (recipient: EmployeePreview | null) =>
      dispatch({ type: "SET_RECIPIENT", recipient }),
    [],
  );
  const setTitle = useCallback(
    (title: TitlePreview | null) => dispatch({ type: "SET_TITLE", title }),
    [],
  );
  const setBody = useCallback(
    (body: ProseMirrorDoc, bodyPlain: string) =>
      dispatch({ type: "SET_BODY", body, bodyPlain }),
    [],
  );
  const addHashtag = useCallback(
    (hashtag: HashtagPreview) => dispatch({ type: "ADD_HASHTAG", hashtag }),
    [],
  );
  const removeHashtag = useCallback(
    (id: number) => dispatch({ type: "REMOVE_HASHTAG", id }),
    [],
  );
  const removeHashtagByLabel = useCallback(
    (label: string) => dispatch({ type: "REMOVE_HASHTAG_BY_LABEL", label }),
    [],
  );
  const addImage = useCallback(
    (image: ImageDraft) => dispatch({ type: "ADD_IMAGE", image }),
    [],
  );
  const removeImageByFile = useCallback(
    (file: File) => dispatch({ type: "REMOVE_IMAGE_BY_FILE", file }),
    [],
  );
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);
  const restore = useCallback(
    (partial: Partial<KudoFormState>) =>
      dispatch({ type: "RESTORE", state: partial }),
    [],
  );

  return {
    state,
    isValid,
    dispatch,
    setRecipient,
    setTitle,
    setBody,
    addHashtag,
    removeHashtag,
    removeHashtagByLabel,
    addImage,
    removeImageByFile,
    reset,
    restore,
  };
}

export type UseKudoFormReturn = ReturnType<typeof useKudoForm>;
