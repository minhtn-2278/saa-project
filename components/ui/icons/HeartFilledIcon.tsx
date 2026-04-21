interface HeartFilledIconProps {
  className?: string;
  size?: number;
}

/**
 * Filled heart icon — used on `HeartsButton` when the current user has liked
 * the Kudo (C.4.1 / B.4.4 active state). Colour comes from `currentColor` so
 * the parent controls it via `--color-live-heart-active` / Tailwind text-color.
 */
export function HeartFilledIcon({ className, size = 20 }: HeartFilledIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M10 17.5s-6.5-4.3-6.5-9.1a3.7 3.7 0 0 1 6.5-2.5 3.7 3.7 0 0 1 6.5 2.5c0 4.8-6.5 9.1-6.5 9.1Z" />
    </svg>
  );
}
