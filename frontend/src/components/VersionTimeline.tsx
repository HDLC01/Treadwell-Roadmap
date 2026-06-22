import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import type { SystemVersion, Status } from "../lib/types";
import { STATUS_VAR, STATUS_LABELS } from "../lib/format";

// Versions render as an n8n-style node flow: each version is a connected node
// (no illustration graphics — just label + status), wired left→right to show the
// project's evolution. Selecting a node scopes the board to that version. Admins
// (in edit mode) can add, inline-edit (label/status/note), and delete versions;
// edits are gated upstream by an "are you sure?" confirm via onRequestEdit.
const VERSION_STATUSES: Status[] = ["planned", "in_progress", "live"];

export default function VersionTimeline({
  versions, selectedId, onSelect, editable, onAdd, onSave, onRequestSave, onDelete,
}: {
  versions: SystemVersion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  editable: boolean;
  onAdd: () => void;
  onSave: (id: string, patch: { label?: string; status?: string; note?: string | null }) => void;
  onRequestSave: (proceed: () => void) => void;
  onDelete: (v: SystemVersion) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!versions.length && !editable) return null;

  return (
    <div className="flex items-center overflow-x-auto border-t border-border bg-surface-2/40 px-4 py-2">
      <span className="mr-3 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted">Versions</span>
      <div className="flex items-center">
        {versions.map((v, i) => (
          <div key={v.id} className="flex items-center">
            {i > 0 && <Wire />}
            <VersionNode
              v={v}
              selected={v.id === selectedId}
              editable={editable}
              editing={editingId === v.id}
              onSelect={() => onSelect(v.id)}
              onStartEdit={() => setEditingId(v.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={(patch) => onRequestSave(() => { onSave(v.id, patch); setEditingId(null); })}
              onDelete={() => onDelete(v)}
            />
          </div>
        ))}
        {editable && (
          <div className="flex items-center">
            {versions.length > 0 && <Wire dashed />}
            <button
              onClick={onAdd}
              className="flex h-[46px] shrink-0 items-center gap-1 rounded-lg border border-dashed border-border bg-surface px-2.5 text-xs font-medium text-muted outline-none transition hover:bg-surface-2 hover:text-fg focus-visible:ring-2 focus-visible:ring-accent"
              title="Add a version"
            >
              <Plus className="h-3.5 w-3.5" /> Add version
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// The connecting wire between two nodes (n8n-style link).
function Wire({ dashed = false }: { dashed?: boolean }) {
  return (
    <span className="flex w-5 shrink-0 items-center" aria-hidden="true">
      {dashed
        ? <span className="block w-full border-t-2 border-dashed border-border" />
        : <span className="block h-0.5 w-full rounded bg-border" />}
    </span>
  );
}

function VersionNode({
  v, selected, editable, editing, onSelect, onStartEdit, onCancelEdit, onSave, onDelete,
}: {
  v: SystemVersion;
  selected: boolean;
  editable: boolean;
  editing: boolean;
  onSelect: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (patch: { label: string; status: string; note: string | null }) => void;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(v.label);
  const [status, setStatus] = useState<string>(v.status);
  const [note, setNote] = useState(v.note ?? "");

  if (editing) {
    return (
      <div className="relative w-60 shrink-0 rounded-lg border-2 border-accent bg-surface p-2.5 shadow-sm">
        <input
          autoFocus value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Version label (e.g. v2)"
          className="w-full rounded border border-border bg-bg px-2 py-1 text-sm font-semibold text-fg"
        />
        <select
          value={status} onChange={(e) => setStatus(e.target.value)}
          className="mt-1.5 w-full rounded border border-border bg-bg px-2 py-1 text-xs text-fg"
        >
          {VERSION_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <textarea
          value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Notes / future ideas (optional)"
          className="mt-1.5 w-full resize-none rounded border border-border bg-bg px-2 py-1 text-xs text-fg"
        />
        <div className="mt-1.5 flex justify-end gap-1">
          <button onClick={onCancelEdit} aria-label="Cancel" className="rounded border border-border px-2 py-0.5 text-xs text-fg hover:bg-surface-2"><X className="h-3.5 w-3.5" /></button>
          <button
            onClick={() => { const l = label.trim(); if (l) onSave({ label: l, status, note: note.trim() || null }); }}
            aria-label="Save version" className="rounded bg-accent px-2 py-0.5 text-xs font-semibold text-white"
          ><Check className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button" tabIndex={0}
      onClick={onSelect}
      onDoubleClick={() => { if (editable) onStartEdit(); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      title={editable ? "Click to view · double-click to edit" : (v.note || STATUS_LABELS[v.status])}
      aria-pressed={selected}
      className={`group relative flex h-[46px] w-36 shrink-0 cursor-pointer flex-col justify-center rounded-lg border bg-surface px-2.5 outline-none transition focus-visible:ring-2 focus-visible:ring-accent ${
        selected ? "border-accent ring-2 ring-accent/40" : "border-border hover:bg-surface-2"
      }`}
    >
      {/* connection points (n8n-style handles) */}
      <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-border bg-surface" aria-hidden="true" />
      <span className="absolute -right-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-border bg-surface" aria-hidden="true" />
      <div className="flex items-center gap-1.5 pr-10">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_VAR[v.status] }} />
        <span className="truncate text-sm font-bold text-fg">{v.label}</span>
      </div>
      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">{STATUS_LABELS[v.status]}</span>
      {editable && (
        <div className="absolute right-1 top-1 flex gap-0.5">
          <button aria-label="Edit version" title="Edit" onClick={(e) => { e.stopPropagation(); onStartEdit(); }} className="rounded p-1 text-muted hover:bg-surface-2 hover:text-fg"><Pencil className="h-3 w-3" /></button>
          <button aria-label="Delete version" title="Delete" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="rounded p-1 text-destructive hover:bg-destructive/10"><Trash2 className="h-3 w-3" /></button>
        </div>
      )}
    </div>
  );
}
