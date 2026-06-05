import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export default function EmptyState({
  title, message, icon: Icon = Inbox,
}: { title: string; message?: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-10 text-center">
      <Icon className="h-8 w-8 text-muted" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-fg">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-muted">{message}</p>}
    </div>
  );
}
