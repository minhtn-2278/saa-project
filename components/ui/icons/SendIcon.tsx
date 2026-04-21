interface SendIconProps {
  className?: string;
  size?: number;
}

/**
 * Paper-plane "send" icon used between sender and recipient on the Kudo
 * Post + Highlight cards (Figma node 1949-12832). 24×24 stroke-only glyph
 * tinted via `currentColor`.
 */
export function SendIcon({ className, size = 24 }: SendIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M21 3 3 10l7 3 3 7 8-17Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m21 3-11 10"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
