interface ItalicIconProps {
  className?: string;
  size?: number;
}

export function ItalicIcon({ className, size = 20 }: ItalicIconProps) {
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
        d="M8 4h7v1.75h-2.4L10.3 14.25H13V16H6v-1.75h2.4l2.3-8.5H8V4Z"
        fill="currentColor"
      />
    </svg>
  );
}
