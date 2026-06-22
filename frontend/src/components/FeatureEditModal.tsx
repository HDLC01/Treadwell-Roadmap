import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { RoadmapItem } from "../lib/types";
import StatusBadge from "./StatusBadge";

// Roomy centered pop-up for editing a feature card (title + details/sub-process),
// instead of the cramped inline editor on the small board node.
export default function FeatureEditModal({
  item, accent, onSave, onClose,
}: {
  item: RoadmapItem | null;
  accent: string;
  onSave: (id: string, patch: { title: string; detail: string | null }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    if (item) { setTitle(item.title); setDetail(item.detail ?? ""); }
  }, [item]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!item) return null;
  const save = () => { const t = title.trim(); if (t) onSave(item.id, { title: t, detail: detail.trim() || null }); };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border p-4" style={{ background: `color-mix(in srgb, ${accent} 10%, var(--surface))` }}>
          <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: accent }} />
          <h2 className="flex-1 text-base font-bold text-fg">Edit project</h2>
          <StatusBadge status={item.status} size="xs" />
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Title
            <input
              autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm font-medium text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Details / sub-process (markdown)
            <textarea
              value={detail} onChange={(e) => setDetail(e.target.value)} rows={12}
              placeholder={"Plain-language summary…\n\n### Sub-process\n1. First step\n2. Second step"}
              className="resize-y rounded-lg border border-border bg-bg px-3 py-2 font-mono text-xs leading-relaxed text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <span className="font-normal text-muted">Tip: the first line shows on the card; the rest renders as the sub-process when opened.</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-fg hover:bg-surface-2">Cancel</button>
          <button onClick={save} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">Save</button>
        </div>
      </div>
    </div>
  );
}
