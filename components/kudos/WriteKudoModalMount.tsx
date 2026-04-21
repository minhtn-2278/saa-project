"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  HashtagPreview,
  TitlePreview,
} from "./WriteKudoModal/hooks/useKudoForm";

const WriteKudoModal = dynamic(
  () =>
    import("./WriteKudoModal/WriteKudoModal.client.boundary").then(
      (m) => m.WriteKudoModal,
    ),
  { ssr: false },
);

interface ApiTitle {
  id: number;
  name: string;
}
interface ApiHashtag {
  id: number;
  label: string;
}

interface WriteKudoModalMountProps {
  /**
   * Optional pre-loaded initial data (usually supplied by the server when
   * the layout can preload). If omitted the modal lazy-fetches on open.
   */
  titles?: TitlePreview[];
  topHashtags?: HashtagPreview[];
}

/**
 * Dashboard-layout island: reads `?write=kudo` from the URL and lazy-loads
 * the modal when the param is present. Closing the modal strips the param.
 */
export function WriteKudoModalMount({
  titles: initialTitles,
  topHashtags: initialHashtags,
}: WriteKudoModalMountProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlOpen = params.get("write") === "kudo";

  // `open` is driven by local state, not directly by the URL, so we can
  // unmount the modal instantly on close without waiting for the Next.js
  // router navigation (which typically takes 50–200 ms). We still sync
  // from the URL so deep links that push `?write=kudo` open the modal.
  const [open, setOpen] = useState(urlOpen);
  useEffect(() => {
    setOpen(urlOpen);
  }, [urlOpen]);

  // Event-driven opener — lets the CTA / FAB open the modal without a URL
  // change (which would re-render the page's Server Component and re-run
  // its DB loaders). Deep-linking via `?write=kudo` stays supported above.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOpen = () => setOpen(true);
    window.addEventListener("kudo:open", onOpen);
    return () => window.removeEventListener("kudo:open", onOpen);
  }, []);

  const [titles, setTitles] = useState<TitlePreview[]>(initialTitles ?? []);
  const [topHashtags, setTopHashtags] = useState<HashtagPreview[]>(
    initialHashtags ?? [],
  );

  // Lazy-fetch initial lists on first open.
  useEffect(() => {
    if (!open) return;
    if (titles.length === 0) {
      fetch("/api/titles")
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (j?.data) {
            setTitles(
              (j.data as ApiTitle[]).map((x) => ({ id: x.id, name: x.name })),
            );
          }
        })
        .catch(() => {});
    }
    if (topHashtags.length === 0) {
      fetch("/api/hashtags?limit=20")
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => {
          if (j?.data) {
            setTopHashtags(
              (j.data as ApiHashtag[]).map((x) => ({
                id: x.id,
                label: x.label,
              })),
            );
          }
        })
        .catch(() => {});
    }
  }, [open, titles.length, topHashtags.length]);

  // Stabilise `handleClose` so the modal doesn't get a fresh `onClose` prop
  // on every URL tick. Latest params/pathname are read via refs. Closing
  // first flips `open` locally (instant React unmount) then fires the async
  // `router.replace` in the background so the URL stays consistent with
  // the UI without blocking the close animation.
  const paramsRef = useRef(params);
  const pathnameRef = useRef(pathname);
  paramsRef.current = params;
  pathnameRef.current = pathname;
  const handleClose = useCallback(() => {
    setOpen(false);
    // Only rewrite the URL if it actually carries `?write=kudo` — otherwise
    // we'd trigger a needless Server Component re-render on every close.
    if (paramsRef.current.get("write") !== "kudo") return;
    const next = new URLSearchParams(paramsRef.current.toString());
    next.delete("write");
    const qs = next.toString();
    router.replace(qs ? `${pathnameRef.current}?${qs}` : pathnameRef.current, {
      scroll: false,
    });
  }, [router]);

  if (!open) return null;

  return (
    <WriteKudoModal
      open={open}
      onClose={handleClose}
      titles={titles}
      topHashtags={topHashtags}
    />
  );
}
