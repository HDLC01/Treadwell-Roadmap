import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check, CircleDot, MinusCircle, Pencil, Plus, Star, Trash2, type LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import type { Phase, RoadmapItem, Status, SystemSummary } from "../../lib/types";
import { LAYER_LABELS, STATUS_LABELS, STATUS_VAR } from "../../lib/format";
import OfficeScene from "../OfficeScene";
import StatusBadge from "../StatusBadge";
import DivisionBadge from "../DivisionBadge";

const STATUS_CYCLE: Status[] = ["not_started", "planned", "in_progress", "live"];
export const nextStatus = (s: Status): Status =>
  STATUS_CYCLE[(STATUS_CYCLE.indexOf(s) + 1) % STATUS_CYCLE.length];

function spriteDot(s: Status): string {
  return s === "in_progress" ? "#3B82F6" : STATUS_VAR[s];
}
const isWorking = (s: Status) => s === "in_progress" || s === "live";

// ── Roadmap: an epoxy phase office (room + tasks + admin editing) ──
export interface PhaseNodeData extends Record<string, unknown> {
  phase: Phase;
  accent: string;
  edit: boolean;
  divisions: SystemSummary[];
  onPhaseStatus: (id: string, next: Status) => void;
  onPhaseDelete: (phase: Phase) => void;
  onAddItem: (phaseId: string, title: string) => void;
  onItemStatus: (id: string, next: Status) => void;
  onItemDivision: (id: string, divId: string) => void;
  onItemFeature: (id: string, val: boolean) => void;
  onItemDelete: (item: RoadmapItem) => void;
}

export function PhaseNode({ data }: NodeProps) {
  const d = data as PhaseNodeData;
  const p = d.phase;
  const [newTask, setNewTask] = useState("");

  return (
    <div className="w-[290px] cursor-pointer overflow-hidden rounded-xl border border-border bg-surface shadow-md transition-shadow hover:shadow-lg">
      <Handle type="target" position={Position.Left} style={{ background: d.accent }} />
      {/* door plate */}
      <div className="flex items-center gap-2 px-3 pt-2 pb-1">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted">{LAYER_LABELS[p.layer_type]}</div>
          <div className="truncate text-sm font-bold text-fg">{p.phase_label || p.title}</div>
        </div>
        {d.edit ? (
          <button
            className="nodrag rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ color: STATUS_VAR[p.status] }}
            onClick={() => d.onPhaseStatus(p.id, nextStatus(p.status))}
            title="Cycle phase status"
          >
            {STATUS_LABELS[p.status]}
          </button>
        ) : (
          <StatusBadge status={p.status} size="xs" />
        )}
      </div>
      {/* the office room */}
      <OfficeScene accent={d.accent} activity={p.layer_type} working={isWorking(p.status)} statusColor={spriteDot(p.status)} width={290} height={80} />

      {/* tasks */}
      <ul className="max-h-[220px] space-y-1 overflow-y-auto p-2">
        {p.items.length === 0 && <li className="px-1 py-2 text-center text-xs text-muted">No tasks yet</li>}
        {p.items.map((it) => (
          <li key={it.id} className="flex items-start gap-1.5 rounded-md px-1.5 py-1 hover:bg-surface-2">
            <span className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_VAR[it.status] }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                {it.is_feature && it.status === "live" && <Star className="h-3 w-3 shrink-0 text-accent" fill="currentColor" />}
                <span className={`text-xs leading-tight ${it.status === "not_started" ? "text-muted" : "text-fg"}`}>{it.title}</span>
              </div>
              {d.edit ? (
                <div className="nodrag mt-1 flex flex-wrap items-center gap-1">
                  <button className="rounded border border-border px-1 py-0.5 text-[10px] font-semibold" style={{ color: STATUS_VAR[it.status] }} onClick={() => d.onItemStatus(it.id, nextStatus(it.status))}>{STATUS_LABELS[it.status]}</button>
                  <select value={it.division_id || ""} onChange={(e) => d.onItemDivision(it.id, e.target.value)} className="rounded border border-border bg-surface px-1 py-0.5 text-[10px] text-fg">
                    <option value="">— div —</option>
                    {d.divisions.map((dv) => <option key={dv.id} value={dv.id}>{dv.name}</option>)}
                  </select>
                  <button className={`rounded p-0.5 ${it.is_feature ? "text-accent" : "text-muted"}`} onClick={() => d.onItemFeature(it.id, !it.is_feature)} title="Feature"><Star className="h-3 w-3" fill={it.is_feature ? "currentColor" : "none"} /></button>
                  <button className="rounded p-0.5 text-destructive" onClick={() => d.onItemDelete(it)} title="Delete"><Trash2 className="h-3 w-3" /></button>
                </div>
              ) : (
                it.division_name && <div className="mt-0.5"><DivisionBadge name={it.division_name} accent={it.division_accent} /></div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {d.edit && (
        <form
          className="nodrag flex items-center gap-1 border-t border-border p-2"
          onSubmit={(e) => { e.preventDefault(); const v = newTask.trim(); if (v) { d.onAddItem(p.id, v); setNewTask(""); } }}
        >
          <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add task…" className="min-w-0 flex-1 rounded border border-border bg-bg px-2 py-1 text-xs text-fg" />
          <button type="submit" className="rounded bg-accent p-1 text-accent-fg"><Plus className="h-3.5 w-3.5" /></button>
          <button type="button" onClick={() => d.onPhaseDelete(p)} className="rounded p-1 text-destructive" title="Delete phase"><Trash2 className="h-3.5 w-3.5" /></button>
        </form>
      )}
      <Handle type="source" position={Position.Right} style={{ background: d.accent }} />
    </div>
  );
}

// ── Feature board: a single feature node (no edges, no office canvas) ──
const LANE_INNER_W = 286;

export interface FeatureNodeData extends Record<string, unknown> {
  item: RoadmapItem;
  accent: string;
  edit: boolean;
  onSave: (id: string, patch: { title?: string; detail?: string | null }) => void;
  onDelete: (item: RoadmapItem) => void;
  onOpen?: (item: RoadmapItem) => void;
}

export function FeatureNode({ data }: NodeProps) {
  const d = data as FeatureNodeData;
  const it = d.item;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(it.title);
  const [detail, setDetail] = useState(it.detail ?? "");
  const clickTimer = useRef<number | null>(null);
  // Single-click opens the detail drawer; double-click (admins) opens inline edit.
  // The single-click is delayed briefly so a double-click can cancel it.
  const handleClick = () => {
    if (editing) return;
    if (clickTimer.current) window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => { d.onOpen?.(it); clickTimer.current = null; }, 200);
  };
  const handleDoubleClick = () => {
    if (clickTimer.current) { window.clearTimeout(clickTimer.current); clickTimer.current = null; }
    if (d.edit) setEditing(true); else d.onOpen?.(it);
  };
  return (
    <div
      className={`w-[240px] overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow duration-150 hover:shadow-md ${editing ? "" : "cursor-pointer"}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <span className="block h-1.5 w-full" style={{ background: STATUS_VAR[it.status] }} />
      <div className="p-2.5">
        {editing ? (
          <div className="nodrag flex flex-col gap-1.5">
            <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border border-border bg-bg px-2 py-1 text-sm text-fg" />
            <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={2} placeholder="Short description (optional)" className="resize-none rounded border border-border bg-bg px-2 py-1 text-xs text-fg" />
            <div className="flex justify-end gap-1">
              <button className="rounded border border-border px-2 py-0.5 text-xs text-fg" onClick={() => { setEditing(false); setTitle(it.title); setDetail(it.detail ?? ""); }}>Cancel</button>
              <button className="rounded bg-accent px-2 py-0.5 text-xs font-semibold text-accent-fg" onClick={() => { const t = title.trim(); if (t) { d.onSave(it.id, { title: t, detail: detail.trim() || null }); setEditing(false); } }}>Save</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-1.5">
              <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_VAR[it.status] }} />
              <span className={`text-sm font-semibold leading-snug text-fg ${d.edit ? "cursor-text" : ""}`} title={d.edit ? "Double-click to edit" : undefined}>{it.title}</span>
            </div>
            {it.detail && <p className="mt-1 line-clamp-2 pl-3.5 text-xs leading-snug text-muted">{it.detail.split("\n")[0].replace(/[*_`]/g, "")}</p>}
            {it.division_name && <div className="mt-1.5 pl-3.5"><DivisionBadge name={it.division_name} accent={it.division_accent} /></div>}
            {d.edit && (
              <div className="nodrag mt-2 flex justify-end gap-1">
                <button aria-label="Edit feature" className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-fg transition duration-150 hover:bg-surface-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" onClick={(e) => { e.stopPropagation(); setEditing(true); }} title="Edit this feature"><Pencil className="h-3 w-3" /> Edit</button>
                <button aria-label="Delete feature" className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-[11px] font-medium text-destructive transition duration-150 hover:bg-destructive/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent" onClick={(e) => { e.stopPropagation(); d.onDelete(it); }} title="Delete this feature"><Trash2 className="h-3 w-3" /> Delete</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Feature board: a status lane (status-coded header + count + add + empty state) ──
const LANE_ICON: Record<string, LucideIcon> = { live: Check, in_progress: CircleDot, not_started: MinusCircle };

export interface LaneNodeData extends Record<string, unknown> {
  label: string;
  count: number;
  height: number;
  laneKey: string;
  color: string;        // CSS var for the lane's status, e.g. "var(--live)"
  edit: boolean;
  onAdd: (laneKey: string) => void;
}

export function LaneNode({ data }: NodeProps) {
  const d = data as LaneNodeData;
  const Icon = LANE_ICON[d.laneKey] ?? MinusCircle;
  const empty = d.count === 0;
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-2/40" style={{ width: LANE_INNER_W, height: d.height }}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5" style={{ background: `color-mix(in srgb, ${d.color} 9%, transparent)` }}>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: d.color }}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {d.label}
          <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted">{d.count}</span>
        </span>
        {d.edit && (
          <button
            aria-label={`Add a feature to ${d.label}`}
            className="nodrag inline-flex cursor-pointer items-center gap-0.5 rounded-md bg-accent px-2 py-1 text-[10px] font-semibold text-accent-fg transition duration-150 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            onClick={() => d.onAdd(d.laneKey)}
            title="Add feature"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        )}
      </div>
      {empty && (
        <div className="flex flex-1 items-center justify-center px-4 text-center text-[11px] text-muted">
          {d.edit ? "Use “+ Add” to create a feature" : "Nothing here yet"}
        </div>
      )}
    </div>
  );
}
