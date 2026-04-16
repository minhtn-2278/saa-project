interface JPFlagIconProps {
  className?: string;
  size?: number;
}

export function JPFlagIcon({ className, size = 24 }: JPFlagIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <g clipPath="url(#jp-clip)">
        <rect width="20" height="15" transform="translate(2 5)" fill="white" />
        <circle cx="12" cy="12.5" r="4.5" fill="#BC002D" />
      </g>
      <defs>
        <clipPath id="jp-clip">
          <rect
            width="20"
            height="15"
            fill="white"
            transform="translate(2 5)"
          />
        </clipPath>
      </defs>
    </svg>
  );
}
