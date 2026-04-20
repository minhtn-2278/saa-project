interface LinkIconProps {
  className?: string;
  size?: number;
}

export function LinkIcon({ className, size = 20 }: LinkIconProps) {
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
        d="M8.5 6.25h-2a3.25 3.25 0 0 0 0 6.5h2v-1.5h-2a1.75 1.75 0 1 1 0-3.5h2v-1.5ZM11.5 6.25h2a3.25 3.25 0 0 1 0 6.5h-2v-1.5h2a1.75 1.75 0 1 0 0-3.5h-2v-1.5ZM7 9.25h6v1.5H7v-1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
