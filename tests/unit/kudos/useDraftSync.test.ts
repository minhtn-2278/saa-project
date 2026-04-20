import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  clearDraft,
  useDraftSync,
} from "@/components/kudos/WriteKudoModal/hooks/useDraftSync";
import { KUDO_DRAFT_STORAGE_KEY } from "@/lib/constants/kudos";
import {
  emptyDoc,
  type KudoFormState,
} from "@/components/kudos/WriteKudoModal/hooks/useKudoForm";
import type { ProseMirrorDoc } from "@/types/kudos";

const docOf = (text: string): ProseMirrorDoc => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

const pristine: KudoFormState = {
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

const dirty: KudoFormState = {
  ...pristine,
  body: docOf("hello"),
  bodyPlain: "hello",
  isDirty: true,
};

describe("useDraftSync", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });
  afterEach(() => {
    sessionStorage.clear();
  });

  it("does NOT persist while the form is pristine (isDirty=false)", () => {
    const onRestore = vi.fn();
    renderHook(() => useDraftSync(pristine, onRestore));
    expect(sessionStorage.getItem(KUDO_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it("persists dirty state to sessionStorage", () => {
    const onRestore = vi.fn();
    renderHook(() => useDraftSync(dirty, onRestore));
    const raw = sessionStorage.getItem(KUDO_DRAFT_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const env = JSON.parse(raw!);
    expect(env.version).toBe(1);
    expect(env.state.bodyPlain).toBe("hello");
  });

  it("calls onRestore on mount when a draft is present", () => {
    sessionStorage.setItem(
      KUDO_DRAFT_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        state: { bodyPlain: "restored" },
      }),
    );
    const onRestore = vi.fn();
    renderHook(() => useDraftSync(pristine, onRestore));
    expect(onRestore).toHaveBeenCalledWith(
      expect.objectContaining({ bodyPlain: "restored" }),
    );
  });

  it("silently drops corrupted drafts", () => {
    sessionStorage.setItem(KUDO_DRAFT_STORAGE_KEY, "{not valid json");
    const onRestore = vi.fn();
    renderHook(() => useDraftSync(pristine, onRestore));
    expect(onRestore).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(KUDO_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it("clearDraft() wipes the storage entry", () => {
    sessionStorage.setItem(
      KUDO_DRAFT_STORAGE_KEY,
      JSON.stringify({ version: 1, state: { body: "x" }, savedAt: 0 }),
    );
    act(() => clearDraft());
    expect(sessionStorage.getItem(KUDO_DRAFT_STORAGE_KEY)).toBeNull();
  });
});
