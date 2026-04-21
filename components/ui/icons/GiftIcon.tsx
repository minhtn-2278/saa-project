interface GiftIconProps {
  className?: string;
  size?: number;
}

/**
 * Gift box icon — leading icon of D.1.8 `Mở quà` button.
 */
export function GiftIcon({ className, size = 20 }: GiftIconProps) {
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
        d="M3.5 8h13v8.5a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V8ZM2.5 5.5h15V8h-15zM10 5.5v11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M6.25 3.5a1.75 1.75 0 0 1 1.75 1.75V5.5H6.25a1 1 0 1 1 0-2ZM13.75 3.5a1.75 1.75 0 0 0-1.75 1.75V5.5h1.75a1 1 0 1 0 0-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
