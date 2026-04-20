"use client";

import { useCallback, useEffect, useState } from "react";
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
  const open = params.get("write") === "kudo";

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

  const handleClose = useCallback(() => {
    const next = new URLSearchParams(params.toString());
    next.delete("write");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [params, pathname, router]);

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
