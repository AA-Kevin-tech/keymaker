import { type TextareaHTMLAttributes } from "react";

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-[100px] w-full rounded-md border border-subtle bg-canvas px-3 py-2 text-ink placeholder:text-meta focus:border-link focus:outline-none focus:ring-2 focus:ring-link/40 ${className}`}
      {...props}
    />
  );
}
