interface PanZoomIconProps {
  className?: string;
  size?: number;
}

/**
 * Pan/Zoom toggle (B.7.2) — four outward-pointing arrows framing the center.
 */
export function PanZoomIcon({ className, size = 20 }: PanZoomIconProps) {
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
        d="M4 8V4h4M16 8V4h-4M4 12v4h4M16 12v4h-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
