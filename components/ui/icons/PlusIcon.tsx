interface PlusIconProps {
  className?: string;
  size?: number;
}

export function PlusIcon({ className, size = 16 }: PlusIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 3.25a.75.75 0 0 1 .75.75v3.25H12a.75.75 0 1 1 0 1.5H8.75V12a.75.75 0 1 1-1.5 0V8.75H4a.75.75 0 1 1 0-1.5h3.25V4A.75.75 0 0 1 8 3.25Z"
        fill="currentColor"
      />
    </svg>
  );
}
