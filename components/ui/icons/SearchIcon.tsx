interface SearchIconProps {
  className?: string;
  size?: number;
}

export function SearchIcon({ className, size = 20 }: SearchIconProps) {
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
      <circle
        cx="9"
        cy="9"
        r="5.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m13 13 3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
