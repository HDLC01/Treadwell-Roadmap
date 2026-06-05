import { useEffect } from "react";
import { X, Star } from "lucide-react";
import type { Phase } from "../lib/types";
import { LAYER_LABELS, STATUS_VAR } from "../lib/format";
import StatusBadge from "./StatusBadge";
import DivisionBadge from "./DivisionBadge";

// Right slide-over showing a phase's full detail + all its task "points".
export default function PhaseDetailDrawer({
  phase, accent, onClose,
}: { phase: Phase | null; accent: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!phase) return null;
  const live = phase.items.filter((i) => i.status === "live").length;

  return (
    <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl">
        <div className="flex items-start gap-2 border-b border-border p-4" style={{ background: `color-mix(in srgb, ${accent} 10%, var(--surface))` }}>
          <span className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ background: accent }} />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{LAYER_LABELS[phase.layer_type]}</div>
            <h2 className="text-lg font-bold text-fg">{phase.phase_label || phase.title}</h2>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={phase.status} size="xs" />
              <span className="num text-xs text-muted">{live}/{phase.items.length} done</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {phase.detail && <p className="border-b border-border px-4 py-3 text-sm text-muted">{phase.detail}</p>}

        <ul className="flex-1 space-y-2 overflow-y-auto p-4">
          {phase.items.length === 0 && <li className="text-sm text-muted">No tasks in this phase yet.</li>}
          {phase.items.map((it) => (
            <li key={it.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start gap-2">
                <span className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STATUS_VAR[it.status] }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {it.is_feature && it.status === "live" && <Star className="h-3.5 w-3.5 shrink-0 text-accent" fill="currentColor" />}
                    <span className="text-sm font-medium text-fg">{it.title}</span>
                  </div>
                  {it.detail && <p className="mt-0.5 text-xs text-muted">{it.detail}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status={it.status} size="xs" />
                    <DivisionBadge name={it.division_name} accent={it.division_accent} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
