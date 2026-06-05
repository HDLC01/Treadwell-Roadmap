import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Plus, Star, Trash2 } from "lucide-react";
import { useState } from "react";
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
