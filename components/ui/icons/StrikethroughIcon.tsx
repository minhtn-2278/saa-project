interface StrikethroughIconProps {
  className?: string;
  size?: number;
}

export function StrikethroughIcon({
  className,
  size = 20,
}: StrikethroughIconProps) {
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
        d="M3 10.25h14v1.5H3v-1.5Zm7-6.25c2.2 0 4 1.35 4 3.25h-1.9c0-.95-.95-1.6-2.1-1.6-1.1 0-2 .55-2 1.45 0 .45.2.8.55 1.05H6.5c-.25-.4-.4-.85-.4-1.35C6.1 5.35 7.75 4 10 4Zm-2 8.25h1.9c.1.95 1.05 1.7 2.2 1.7 1.2 0 2-.65 2-1.65 0-.2-.05-.4-.15-.55H14c.35.4.55.9.55 1.5 0 1.9-1.7 3.25-3.85 3.25S8.05 14.25 8 12.25Z"
        fill="currentColor"
      />
    </svg>
  );
}
