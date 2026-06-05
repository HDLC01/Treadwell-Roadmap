// Small tag showing which Division a task belongs to.
export default function DivisionBadge({
  name, accent,
}: { name?: string | null; accent?: string | null }) {
  if (!name) return null;
  const color = accent || "var(--muted)";
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {name}
    </span>
  );
}
