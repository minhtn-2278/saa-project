"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

interface ProfileHoverTargetProps {
  /** The employee whose profile should be linked on click. */
  employeeId: number;
  /** The avatar / name / combined UI to wrap. */
  children: ReactNode;
  /** Optional class for layout overrides. */
  className?: string;
  /** Hover-intent delay in ms before firing the open event. Defaults to 200. */
  hoverDelayMs?: number;
}

/**
 * Click → navigate to `/profile/{id}`. Hover-intent (default 200 ms) →
 * dispatch a `profile:preview:open` `CustomEvent` on `window` with the
 * employee id + anchor rect. A future Profile popover feature subscribes to
 * these events; until then, the dispatch is a harmless no-op and the click
 * path still works.
 *
 * Plan § T026, FR-014. The popover component itself (`721:5827`) is OUT OF
 * SCOPE per spec; this target only emits the trigger.
 */
export function ProfileHoverTarget({
  employeeId,
  children,
  className,
  hoverDelayMs = 200,
}: ProfileHoverTargetProps) {
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const openTimer = useRef<number | null>(null);

  useEffect(() => () => clearOpenTimer(openTimer), []);

  const handleEnter = () => {
    clearOpenTimer(openTimer);
    openTimer.current = window.setTimeout(() => {
      const el = linkRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      window.dispatchEvent(
        new CustomEvent("profile:preview:open", {
          detail: {
            employeeId,
            anchorRect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
            },
          },
        }),
      );
    }, hoverDelayMs);
  };

  const handleLeave = () => {
    clearOpenTimer(openTimer);
    window.dispatchEvent(
      new CustomEvent("profile:preview:close", { detail: { employeeId } }),
    );
  };

  return (
    <Link
      ref={linkRef}
      href={`/profile/${employeeId}`}
      prefetch={false}
      className={className}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
    >
      {children}
    </Link>
  );
}

function clearOpenTimer(ref: { current: number | null }) {
  if (ref.current !== null) {
    window.clearTimeout(ref.current);
    ref.current = null;
  }
}
