import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, LayoutDashboard, ExternalLink, Flag, Check, RotateCcw, Trash2, Send } from "lucide-react";
import type { RoadmapItem, ProjectNote } from "../lib/types";
import { getItemNotes, addItemNote, setNoteResolved, deleteNote } from "../lib/api";
import { formatAuthor, timeAgo } from "../lib/format";
import StatusBadge from "./StatusBadge";
import DivisionBadge from "./DivisionBadge";
import MarkdownView from "./MarkdownView";
import ConfirmDialog from "./ConfirmDialog";

// Right slide-over showing a feature/tool detail. `detail` renders as markdown.
// For a Live tool, pass `boardSlug` (+ optional `liveUrl`) to show a button that
// opens its kanban board, and `label` to relabel the header ("Tool" vs "Feature").
// Projects (not tools) also carry a NOTES thread: everyone reads; admins (Hanz)
// add / resolve / delete. An unresolved note flags the project red on the board,
// so `onNotesChanged` lets the caller refresh the board when the thread changes.
export default function FeatureDetailDrawer({
  item, accent, onClose, label = "Feature", boardSlug, liveUrl,
  canManageNotes = false, onNotesChanged,
}: {
  item: RoadmapItem | null;
  accent: string;
  onClose: () => void;
  label?: string;
  boardSlug?: string;
  liveUrl?: string | null;
  canManageNotes?: boolean;
  onNotesChanged?: () => void;
}) {
  const nav = useNavigate();
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [delNote, setDelNote] = useState<ProjectNote | null>(null);

  const itemId = item?.id;
  const showNotes = !!item && label !== "Tool"; // tools/systems have no notes thread

  const loadNotes = useCallback(() => {
    if (!itemId || label === "Tool") { setNotes([]); return; }
    setLoadingNotes(true);
    getItemNotes(itemId)
      .then((r) => setNotes(r.notes))
      .catch(() => setNotes([]))
      .finally(() => setLoadingNotes(false));
  }, [itemId, label]);

  useEffect(() => { setDraft(""); loadNotes(); }, [loadNotes]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!item) return null;

  const openCount = notes.filter((n) => !n.resolved).length;

  const addNote = async () => {
    const body = draft.trim();
    if (!body || !itemId || busy) return;
    setBusy(true);
    try { await addItemNote(itemId, body); setDraft(""); loadNotes(); onNotesChanged?.(); }
    finally { setBusy(false); }
  };
  const toggleResolved = async (n: ProjectNote) => {
    await setNoteResolved(n.id, !n.resolved).catch(() => {});
    loadNotes(); onNotesChanged?.();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <div className="flex items-start gap-2 border-b border-border p-4" style={{ background: `color-mix(in srgb, ${accent} 10%, var(--surface))` }}>
          <span className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ background: accent }} />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
            <h2 className="text-lg font-bold text-fg">{item.title}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StatusBadge status={item.status} size="xs" />
              {item.division_name && <DivisionBadge name={item.division_name} accent={item.division_accent} />}
              {openCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  <Flag className="h-3 w-3" fill="currentColor" /> {openCount} open note{openCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div>
            {item.detail
              ? <MarkdownView markdown={item.detail} />
              : <p className="text-sm text-muted">No additional detail yet.</p>}
          </div>

          {showNotes && (
            <section className="border-t border-border pt-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Flag className="h-4 w-4 text-rose-600" />
                <h3 className="text-sm font-bold text-fg">Notes</h3>
                <span className="text-xs text-muted">— questions & asks from Hanz</span>
              </div>

              {loadingNotes ? (
                <div className="flex justify-center py-4">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
                </div>
              ) : notes.length === 0 ? (
                <p className="text-xs text-muted">
                  {canManageNotes ? "No notes yet. Add one below to flag this project." : "No notes on this project."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {notes.map((n) => (
                    <li key={n.id} className={`rounded-lg border p-2.5 ${n.resolved ? "border-border bg-surface-2/50" : "border-rose-500/30 bg-rose-500/5"}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-fg">{formatAuthor(n.author_email) || "Hanz"}</span>
                        <span className="text-[11px] text-muted">{timeAgo(n.created_at)}</span>
                        {n.resolved && <span className="rounded bg-surface-2 px-1.5 py-px text-[10px] font-medium text-muted">resolved</span>}
                        {canManageNotes && (
                          <span className="ml-auto flex items-center gap-0.5">
                            <button type="button" onClick={() => toggleResolved(n)}
                              title={n.resolved ? "Mark unresolved" : "Mark resolved"}
                              aria-label={n.resolved ? "Mark unresolved" : "Mark resolved"}
                              className="rounded p-1 text-muted hover:bg-surface-2 hover:text-fg">
                              {n.resolved ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                            </button>
                            <button type="button" onClick={() => setDelNote(n)}
                              title="Delete note" aria-label="Delete note"
                              className="rounded p-1 text-muted hover:bg-rose-500/15 hover:text-rose-600">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        )}
                      </div>
                      <p className={`mt-1 whitespace-pre-wrap text-sm ${n.resolved ? "text-muted line-through" : "text-fg"}`}>{n.body}</p>
                    </li>
                  ))}
                </ul>
              )}

              {canManageNotes && (
                <div className="mt-3">
                  <textarea
                    value={draft} onChange={(e) => setDraft(e.target.value)} rows={2}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote(); }}
                    placeholder="Add a note — a question, clarification, or something you need from Kyle…"
                    className="w-full resize-y rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[11px] text-muted">Only you can add notes. Everyone can read them.</span>
                    <button type="button" onClick={addNote} disabled={busy || !draft.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-fg transition hover:brightness-110 disabled:opacity-50">
                      <Send className="h-3.5 w-3.5" /> {busy ? "Adding…" : "Add note"}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
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
      </div>

      <ConfirmDialog
        open={!!delNote}
        title="Delete this note?"
        message="This can't be undone."
        confirmLabel="Delete"
        destructive
        busy={busy}
        onCancel={() => setDelNote(null)}
        onConfirm={async () => {
          if (delNote) {
            setBusy(true);
            try { await deleteNote(delNote.id); } catch { /* ignore */ } finally { setBusy(false); }
          }
          setDelNote(null); loadNotes(); onNotesChanged?.();
        }}
      />
    </div>
  );
}
