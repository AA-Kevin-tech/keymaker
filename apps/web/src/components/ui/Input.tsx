import { type InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-md border border-subtle bg-canvas px-3 py-2 text-ink placeholder:text-meta focus:border-link focus:outline-none focus:ring-2 focus:ring-link/40 ${className}`}
      {...props}
    />
  );
}
