import { Plus } from "lucide-react";
import type { SystemVersion } from "../lib/types";
import { STATUS_VAR, STATUS_LABELS } from "../lib/format";

// Horizontal version strip (v1, v2, planned v3 …). Selecting a pill scopes the
// feature board below to that version. Admins get a trailing "+ Add version".
export default function VersionTimeline({
  versions, selectedId, onSelect, isAdmin, onAdd,
}: {
  versions: SystemVersion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isAdmin: boolean;
  onAdd: () => void;
}) {
  if (!versions.length && !isAdmin) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto border-t border-border bg-surface px-4 py-2">
      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted">Versions</span>
      {versions.map((v) => {
        const sel = v.id === selectedId;
        return (
          <button
            key={v.id}
            onClick={() => onSelect(v.id)}
            title={v.note || STATUS_LABELS[v.status]}
            aria-pressed={sel}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              sel
                ? "border-accent bg-accent/10 text-fg"
                : "border-border bg-surface text-muted hover:bg-surface-2 hover:text-fg"
            }`}
          >
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: STATUS_VAR[v.status] }} />
            {v.label}
          </button>
        );
      })}
      {isAdmin && (
        <button
          onClick={onAdd}
          className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg"
          title="Add a version"
        >
          <Plus className="h-3.5 w-3.5" /> Add version
        </button>
      )}
    </div>
  );
}
