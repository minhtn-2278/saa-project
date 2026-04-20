interface BoldIconProps {
  className?: string;
  size?: number;
}

export function BoldIcon({ className, size = 20 }: BoldIconProps) {
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
        d="M6 4h4.5a3 3 0 0 1 1.8 5.4A3.25 3.25 0 0 1 10.75 16H6V4Zm2 2v3.25h2.5a1.25 1.25 0 1 0 0-2.5H8Zm0 5.25V14h2.75a1.375 1.375 0 0 0 0-2.75H8Z"
        fill="currentColor"
      />
    </svg>
  );
}
