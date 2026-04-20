interface QuoteIconProps {
  className?: string;
  size?: number;
}

export function QuoteIcon({ className, size = 20 }: QuoteIconProps) {
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
        d="M5 6h3v3.5a3.5 3.5 0 0 1-3.5 3.5v-1.5A2 2 0 0 0 6.5 9.5H5V6Zm7 0h3v3.5a3.5 3.5 0 0 1-3.5 3.5v-1.5a2 2 0 0 0 2-2H12V6Z"
        fill="currentColor"
      />
    </svg>
  );
}
