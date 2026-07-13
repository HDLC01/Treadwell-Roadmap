import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Status } from "../lib/types";
import { STATUS_LABELS } from "../lib/format";

const STATUSES: Status[] = ["live", "in_progress", "planned", "not_started"];

export type EntityValues = {
  title: string;
  status: Status;
  detail?: string | null;        // project sub-process (markdown)
  summary?: string | null;       // division summary
  accent?: string | null;        // division accent color
  target_date?: string | null;   // project: when we plan to tackle it (YYYY-MM-DD)
  belongs_to?: string | null;    // project: system_id it files under (a tool, or the division)
};

// Where a project subprocess is filed: the division itself, or one of its tools.
export type BelongsToOption = { id: string; name: string; isDivision?: boolean };

// Create/edit pop-up for a home-page division or project. Returns the field
// values; the caller maps them to the right API (create vs update).
export default function EntityEditModal({
  kind, mode, initial, accent, busy, belongsToOptions, onSave, onClose,
}: {
  kind: "project" | "division";
  mode: "create" | "edit";
  initial?: Partial<EntityValues>;
  accent: string;
  busy?: boolean;
  belongsToOptions?: BelongsToOption[];
  onSave: (values: EntityValues) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<Status>("planned");
  const [detail, setDetail] = useState("");
  const [summary, setSummary] = useState("");
  const [color, setColor] = useState("#475569");
  const [targetDate, setTargetDate] = useState("");
  const [belongsTo, setBelongsTo] = useState("");

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setStatus(initial?.status ?? (kind === "division" ? "in_progress" : "not_started"));
    setDetail(initial?.detail ?? "");
    setSummary(initial?.summary ?? "");
    setColor(initial?.accent ?? "#475569");
    setTargetDate(initial?.target_date ?? "");
    setBelongsTo(initial?.belongs_to ?? "");
  }, [initial, kind]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isDivision = kind === "division";
  const save = () => {
    const t = title.trim();
    if (!t || busy) return;
    onSave({
      title: t,
      status,
      detail: isDivision ? null : (detail.trim() || null),
      summary: isDivision ? (summary.trim() || null) : null,
      accent: isDivision ? color : null,
      target_date: isDivision ? null : (targetDate || null),
      belongs_to: isDivision ? null : (belongsTo || null),
    });
  };

  const heading = `${mode === "create" ? "Add" : "Edit"} ${isDivision ? "division" : "project"}`;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border p-4" style={{ background: `color-mix(in srgb, ${accent} 10%, var(--surface))` }}>
          <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: accent }} />
          <h2 className="flex-1 text-base font-bold text-fg">{heading}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            {isDivision ? "Name" : "Title"}
            <input
              autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !isDivision) save(); }}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm font-medium text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            Status
            <select
              value={status} onChange={(e) => setStatus(e.target.value as Status)}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm font-medium text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </label>

          {isDivision ? (
            <>
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                Summary
                <textarea
                  value={summary} onChange={(e) => setSummary(e.target.value)} rows={3}
                  placeholder="What this division covers…"
                  className="resize-y rounded-lg border border-border bg-bg px-3 py-2 text-sm leading-relaxed text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                Accent color
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-12 cursor-pointer rounded border border-border bg-bg" />
                <span className="font-mono font-normal">{color}</span>
              </label>
            </>
          ) : (
            <>
              {belongsToOptions && belongsToOptions.length > 1 && (
                <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                  Belongs to <span className="font-normal text-muted/70">— file this under a tool, or keep it on the division</span>
                  <select
                    value={belongsTo} onChange={(e) => setBelongsTo(e.target.value)}
                    className="rounded-lg border border-border bg-bg px-3 py-2 text-sm font-medium text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {belongsToOptions.map((o) => (
                      <option key={o.id} value={o.id}>{o.isDivision ? `${o.name} (division)` : o.name}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                Target date <span className="font-normal text-muted/70">— when we plan to tackle this (optional)</span>
                <input
                  type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                  className="rounded-lg border border-border bg-bg px-3 py-2 text-sm font-medium text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                Details / sub-process (markdown)
                <textarea
                  value={detail} onChange={(e) => setDetail(e.target.value)} rows={10}
                  placeholder={"Plain-language summary…\n\n### Sub-process\n1. First step\n2. Second step"}
                  className="resize-y rounded-lg border border-border bg-bg px-3 py-2 font-mono text-xs leading-relaxed text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </label>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-fg hover:bg-surface-2">Cancel</button>
          <button onClick={save} disabled={busy || !title.trim()} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
