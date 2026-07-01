import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, LayoutDashboard, ExternalLink } from "lucide-react";
import type { RoadmapItem } from "../lib/types";
import StatusBadge from "./StatusBadge";
import DivisionBadge from "./DivisionBadge";
import MarkdownView from "./MarkdownView";

// Right slide-over showing a feature/tool detail. `detail` renders as markdown.
// For a Live tool, pass `boardSlug` (+ optional `liveUrl`) to show a button that
// opens its kanban board, and `label` to relabel the header ("Tool" vs "Feature").
export default function FeatureDetailDrawer({
  item, accent, onClose, label = "Feature", boardSlug, liveUrl,
}: {
  item: RoadmapItem | null;
  accent: string;
  onClose: () => void;
  label?: string;
  boardSlug?: string;
  liveUrl?: string | null;
}) {
  const nav = useNavigate();
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
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
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
            : <p className="text-sm text-muted">No additional detail yet.</p>}
        </div>

        {boardSlug && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border p-4">
            <button
              onClick={() => { nav(`/floor/${boardSlug}`); onClose(); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <LayoutDashboard className="h-4 w-4" /> Open the board
            </button>
            {liveUrl && (
              <a href={liveUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-fg transition hover:bg-surface-2">
                <ExternalLink className="h-4 w-4" /> Visit live site
              </a>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
