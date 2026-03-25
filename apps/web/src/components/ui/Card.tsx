export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-subtle bg-elevated shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
