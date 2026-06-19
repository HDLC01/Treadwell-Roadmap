import { useEffect } from "react";
import { X } from "lucide-react";
import type { RoadmapItem } from "../lib/types";
import StatusBadge from "./StatusBadge";
import DivisionBadge from "./DivisionBadge";
import MarkdownView from "./MarkdownView";

// Right slide-over showing a feature's detail / sub-process. The `detail` field
// is rendered as markdown (numbered sub-steps etc.). Modeled on PhaseDetailDrawer.
export default function FeatureDetailDrawer({
  item, accent, onClose,
}: { item: RoadmapItem | null; accent: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl">
        <div className="flex items-start gap-2 border-b border-border p-4" style={{ background: `color-mix(in srgb, ${accent} 10%, var(--surface))` }}>
          <span className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ background: accent }} />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Feature</div>
            <h2 className="text-lg font-bold text-fg">{item.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} size="xs" />
              {item.division_name && <DivisionBadge name={item.division_name} accent={item.division_accent} />}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {item.detail
            ? <MarkdownView markdown={item.detail} />
            : <p className="text-sm text-muted">No additional detail for this feature yet.</p>}
        </div>
      </aside>
    </div>
  );
}
