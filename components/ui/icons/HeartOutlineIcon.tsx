interface HeartOutlineIconProps {
  className?: string;
  size?: number;
}

/**
 * Outline heart icon — `HeartsButton` idle state (C.4.1 / B.4.4 inactive).
 */
export function HeartOutlineIcon({
  className,
  size = 20,
}: HeartOutlineIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 17.5s-6.5-4.3-6.5-9.1a3.7 3.7 0 0 1 6.5-2.5 3.7 3.7 0 0 1 6.5 2.5c0 4.8-6.5 9.1-6.5 9.1Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
