interface CheckIconProps {
  className?: string;
  size?: number;
}

export function CheckIcon({ className, size = 14 }: CheckIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M11.53 3.72a.75.75 0 0 1 0 1.06l-5.5 5.5a.75.75 0 0 1-1.06 0L2.47 7.78a.75.75 0 1 1 1.06-1.06L5.5 8.69l4.97-4.97a.75.75 0 0 1 1.06 0Z"
        fill="currentColor"
      />
    </svg>
  );
}
