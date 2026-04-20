interface MaskIconProps {
  className?: string;
  size?: number;
}

/**
 * Incognito / mask glyph. Used as the prefix icon on the Anonymous Alias
 * input (G.1) in the Write-Kudo modal — signals the "hide identity" state.
 */
export function MaskIcon({ className, size = 24 }: MaskIconProps) {
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
        d="M4 10.5C4 9 5.5 7.5 7 7.5h10c1.5 0 3 1.5 3 3 0 .7-.3 1.5-.8 2.2-.6.8-1.5 1.3-2.6 1.3-1.4 0-2.8-1-3.1-2.3-.1-.3-.3-.6-.5-.8a.75.75 0 0 0-1 0c-.2.2-.4.5-.5.8-.3 1.3-1.7 2.3-3.1 2.3-1.1 0-2-.5-2.6-1.3-.5-.7-.8-1.5-.8-2.2Zm3 5.5c1.6 0 3.2-.9 3.9-2.2.1-.2.3-.3.5-.3h1.2c.2 0 .4.1.5.3.7 1.3 2.3 2.2 3.9 2.2 1.5 0 2.8-.7 3.6-1.8.2-.2.4-.4.6-.4a.85.85 0 0 1 .8 1 5.25 5.25 0 0 1-5 4.2c-2 0-3.8-1.1-4.7-2.7-.9 1.6-2.7 2.7-4.7 2.7a5.25 5.25 0 0 1-5-4.2.85.85 0 0 1 .8-1c.2 0 .4.2.6.4A4.5 4.5 0 0 0 7 16Z"
        fill="currentColor"
      />
    </svg>
  );
}
