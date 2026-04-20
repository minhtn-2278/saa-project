interface BulletListIconProps {
  className?: string;
  size?: number;
}

export function BulletListIcon({ className, size = 20 }: BulletListIconProps) {
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
      <circle cx="4" cy="5.5" r="1.25" fill="currentColor" />
      <circle cx="4" cy="10" r="1.25" fill="currentColor" />
      <circle cx="4" cy="14.5" r="1.25" fill="currentColor" />
      <rect x="7.5" y="4.75" width="9" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="7.5" y="9.25" width="9" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="7.5" y="13.75" width="9" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  );
}
