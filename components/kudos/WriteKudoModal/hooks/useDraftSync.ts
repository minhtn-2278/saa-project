"use client";

import { useEffect, useRef } from "react";
import { KUDO_DRAFT_STORAGE_KEY } from "@/lib/constants/kudos";
import type { KudoFormState } from "./useKudoForm";

/**
 * Persist the form draft to `sessionStorage` on every change and restore
 * on mount. Matches FR-011 (draft persistence, session-scoped, no cross-
 * device leaks).
 *
 * Storage key is namespaced + versioned (see `KUDO_DRAFT_STORAGE_KEY`) so
 * we can change the shape without polluting returning users.
 *
 * Phase-3 scope: we store the full state including recipient/title/hashtags
 * as previews (already ids + labels). When restored, if any id becomes
 * stale (recipient deleted etc.) the caller is responsible for revalidating;
 * Phase-4+ adds that revalidation step.
 */

interface DraftEnvelope {
  version: 1;
  state: Partial<KudoFormState>;
  savedAt: number;
}

export function useDraftSync(
  state: KudoFormState,
  onRestore: (restored: Partial<KudoFormState>) => void,
  enabled: boolean = true,
) {
  const restoredRef = useRef(false);

  // Restore once on mount.
  useEffect(() => {
    if (!enabled || restoredRef.current) return;
    restoredRef.current = true;
    try {
      const raw = sessionStorage.getItem(KUDO_DRAFT_STORAGE_KEY);
      if (!raw) return;
      const env = JSON.parse(raw) as DraftEnvelope;
      if (env.version !== 1 || !env.state) return;
      // Shallow sanity: recipient must be either null or have id + fullName.
      onRestore(env.state);
    } catch {
      // Corrupted draft — drop silently.
      sessionStorage.removeItem(KUDO_DRAFT_STORAGE_KEY);
    }
  }, [enabled, onRestore]);

  // Persist on every state change (skip when disabled).
  useEffect(() => {
    if (!enabled) return;
    // Don't persist a pristine state.
    if (!state.isDirty) return;
    try {
      const env: DraftEnvelope = {
        version: 1,
        savedAt: Date.now(),
        state: {
          recipient: state.recipient,
          title: state.title,
          body: state.body,
          bodyPlain: state.bodyPlain,
          hashtags: state.hashtags,
          // `images` are intentionally omitted: they hold File references
          // which don't survive JSON.stringify, and restored uploads would
          // still need to be re-uploaded anyway. The uploader handles
          // already-posted uploads via the server-side `uploads` row id,
          // so a tab reload while an upload is in-flight forfeits it.
          isAnonymous: state.isAnonymous,
          anonymousAlias: state.anonymousAlias,
        },
      };
      sessionStorage.setItem(KUDO_DRAFT_STORAGE_KEY, JSON.stringify(env));
    } catch {
      // sessionStorage full / disabled — ignore.
    }
  }, [state, enabled]);
}

export function clearDraft() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(KUDO_DRAFT_STORAGE_KEY);
}
