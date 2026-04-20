interface FieldLabelProps {
  htmlFor?: string;
  id?: string;
  required?: boolean;
  children: string;
  className?: string;
}

/**
 * Field label primitive. Design: Montserrat 22/28 700 #00101A,
 * required asterisk uses Noto Sans JP 16/20 700 #CF1322.
 */
export function FieldLabel({
  htmlFor,
  id,
  required,
  children,
  className,
}: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      id={id}
      className={`inline-flex items-baseline gap-0.5 text-[22px] leading-7 font-bold text-[#00101A] ${className ?? ""}`}
    >
      {children}
      {required && (
        <span
          aria-hidden="true"
          className="text-base leading-5 font-bold text-[#CF1322]"
          style={{ fontFamily: '"Noto Sans JP", var(--font-geist-sans)' }}
        >
          {" *"}
        </span>
      )}
    </label>
  );
}
