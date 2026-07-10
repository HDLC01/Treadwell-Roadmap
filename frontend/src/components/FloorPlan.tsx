import { useState, useRef, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable, pointerWithin,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import {
  DoorOpen, Radar, BarChart3, Megaphone, HardHat, Server,
  FileText, Sparkles, Building2, ExternalLink, ArrowUp, Flag,
  Pencil, Trash2, Plus, Star, Calendar, AlertCircle, type LucideIcon,
} from "lucide-react";

// Keyboard activation for the div-role=button cards (Enter/Space -> open).
function cardKeyDown(open: () => void) {
  return (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
  };
}
import type { SystemSummary } from "../lib/types";
import { STATUS_VAR, STATUS_LABELS, formatAuthor, targetDateLabel, dueState } from "../lib/format";
import StatusBadge from "./StatusBadge";

type FloorProject = { id: string; title: string; detail?: string | null; status: string; created_by?: string | null; priority?: boolean; target_date?: string | null; open_notes?: number; version?: string | null };

// Home-page board filter: any status, everything, or just the starred priorities.
type FilterKey = "all" | "live" | "in_progress" | "planned" | "not_started" | "priority";
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in_progress", label: "In Progress" },
  { key: "planned", label: "Planned" },
  { key: "live", label: "Live" },
  { key: "not_started", label: "Not Started" },
  { key: "priority", label: "Priority" },
];

const SALES_SLUG = "sales-marketing"; // the department the shipped systems hang under

// Desktop column count = number of divisions, so they all sit in one row
// (e.g. "Others" beside "Admin & IT"). Literal class strings so Tailwind emits them.
const COL_CLASS: Record<number, string> = {
  1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3",
  4: "sm:grid-cols-4", 5: "sm:grid-cols-5", 6: "sm:grid-cols-6",
};

function accentOf(s: SystemSummary): string {
  return s.accent && s.accent.startsWith("#") ? s.accent : "#475569";
}
function statusColor(status: string): string {
  return STATUS_VAR[status as keyof typeof STATUS_VAR] ?? "#94a3b8";
}
function statusLabel(status: string): string {
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status;
}

const DEPT_ICON: Record<string, LucideIcon> = {
  "ai-implementation": Sparkles,
  "proposal-tool": FileText,
  "news-feed": Radar,
  operations: HardHat,
  finance: BarChart3,
  "sales-marketing": Megaphone,
  "admin-it": Server,
};
const iconOf = (slug: string): LucideIcon => DEPT_ICON[slug] ?? Building2;

function VersionPill({ label, status }: { label: string; status?: string }) {
  const c = statusColor(status ?? "in_progress");
  return (
    <span
      className="rounded px-1 py-px text-[9px] font-bold uppercase tracking-wide"
      style={{ color: c, background: `${c}22` }}
      title={status ? `${label} — ${statusLabel(status)}` : label}
    >
      {label}
    </span>
  );
}

// Hover-revealed edit/delete cluster (editors). Stops propagation so it never
// triggers the card's open/drawer click.
function CardControls({ onEdit, onDelete, editLabel, deleteLabel }: {
  onEdit: () => void; onDelete: () => void; editLabel: string; deleteLabel: string;
}) {
  return (
    <span className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
      <button type="button" title={editLabel} aria-label={editLabel}
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="rounded p-0.5 text-slate-500 hover:bg-black/10 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white">
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button type="button" title={deleteLabel} aria-label={deleteLabel}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="rounded p-0.5 text-slate-500 hover:bg-rose-500/15 hover:text-rose-600">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

// A department box — the org-chart parent node. `canEdit` (any signed-in user)
// gates "Add Project"; `isAdmin` gates editing/deleting the division itself.
function DeptBox({ s, onOpen, subDone, subTotal, isAdmin, canEdit, onAddProject, onEdit, onDelete }: {
  s: SystemSummary; onOpen: (slug: string) => void; subDone: number; subTotal: number;
  isAdmin: boolean; canEdit: boolean; onAddProject: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const accent = accentOf(s);
  const pct = subTotal ? Math.round((subDone / subTotal) * 100) : 0;
  const Icon = iconOf(s.slug);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(s.slug)}
      onKeyDown={cardKeyDown(() => onOpen(s.slug))}
      title={s.summary || `Open ${s.name}`}
      aria-label={`Open the ${s.name} roadmap`}
      className="group relative flex h-44 cursor-pointer flex-col overflow-hidden rounded-lg bg-[#efe9df] text-left shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] outline-none transition duration-150 hover:z-10 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-accent dark:bg-slate-800"
    >
      <span className="h-1.5 w-full shrink-0" style={{ background: accent }} />
      <div className="flex shrink-0 items-center justify-between gap-1 px-3 pt-2">
        <span className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{s.name}</span>
        <span className="flex shrink-0 items-center gap-1">
          {isAdmin && (
            <span className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              <button type="button" title={`Edit ${s.name}`} aria-label={`Edit ${s.name}`}
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="rounded p-0.5 text-slate-500 hover:bg-black/10 hover:text-slate-900 dark:hover:bg-white/10 dark:hover:text-white">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button type="button" title={`Delete ${s.name}`} aria-label={`Delete ${s.name}`}
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="rounded p-0.5 text-slate-500 hover:bg-rose-500/15 hover:text-rose-600">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          <StatusBadge status={s.status} size="xs" />
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 px-3">
        <Icon className="h-12 w-12 opacity-20" strokeWidth={1.5} style={{ color: accent }} aria-hidden="true" />
        {canEdit && (
          <button type="button" title={`Add a project to ${s.name}`}
            onClick={(e) => { e.stopPropagation(); onAddProject(); }}
            className="inline-flex items-center gap-1 rounded-md border border-accent/40 bg-accent/5 px-2.5 py-1 text-[11px] font-semibold text-accent transition hover:bg-accent/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
            Add Project <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="shrink-0 px-3 pb-2">
        {subTotal > 0 && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
          </div>
        )}
        <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400">
          <span>{subTotal > 0 ? `${subDone}/${subTotal} done · Department` : "Department"}</span>
          {s.live_url ? (
            <a href={s.live_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 font-semibold text-accent hover:underline" title={`Open ${s.name} (live site)`}>
              <ExternalLink className="h-3 w-3" /> Visit site
            </a>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-slate-400 transition group-hover:text-slate-700 dark:group-hover:text-slate-200">
              <DoorOpen className="h-3 w-3" /> open
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// A shipped-system child node (Proposal Tool / News Feed). Colored by STATUS;
// shows the system's own version(s). Not draggable — systems are structural.
function ProjectSubBox({ s, divisionId, canEdit, onOpen, onToggleStar }: {
  s: SystemSummary; divisionId: string; canEdit: boolean; onOpen: (s: SystemSummary) => void; onToggleStar: () => void;
}) {
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: s.id, data: { system: s, kind: "system", divisionId }, disabled: !canEdit,
  });
  const color = statusColor(s.status);
  const done = s.live_item_count;
  const total = s.item_count;
  const Icon = iconOf(s.slug);
  return (
    <div
      ref={setNodeRef}
      {...(canEdit ? listeners : {})}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(s)}
      onKeyDown={cardKeyDown(() => onOpen(s))}
      title={canEdit ? `${s.name} — click to open, or drag to another division` : (s.summary || `Open ${s.name}`)}
      aria-label={`Open the ${s.name} details`}
      className={`group relative flex touch-none items-center gap-2 overflow-hidden rounded-md bg-[#efe9df] px-2.5 py-2 text-left shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] outline-none transition duration-150 before:absolute before:-left-3 before:top-1/2 before:h-px before:w-3 before:bg-slate-400/70 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent dark:bg-slate-800 dark:before:bg-slate-500/70 ${canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${isDragging ? "opacity-30" : s.priority ? "ring-1 ring-amber-400/70" : ""}`}
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
      <Icon className="ml-1 h-4 w-4 shrink-0 opacity-60" strokeWidth={1.5} style={{ color }} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block break-words leading-snug text-xs font-bold text-slate-800 dark:text-slate-100">{s.name.split(" — ")[0]}</span>
        <span className="block text-[10px] text-slate-500 dark:text-slate-400">{total ? `${done}/${total} done` : "planning"}</span>
      </span>
      {s.live_url && (
        <a href={s.live_url} target="_blank" rel="noopener noreferrer" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}
          className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-black/5 hover:text-accent dark:hover:bg-white/10"
          title={`Open ${s.name} (live site)`} aria-label={`Open the ${s.name} live site in a new tab`}>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      {canEdit ? (
        <button type="button"
          title={s.priority ? "Unstar (remove priority)" : "Star as priority — do this next"}
          aria-label={s.priority ? `Unstar ${s.name}` : `Star ${s.name} as priority`}
          aria-pressed={s.priority}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
          className={`shrink-0 rounded p-0.5 transition ${s.priority ? "text-amber-500" : "text-slate-400 hover:text-amber-500"}`}>
          <Star className="h-3.5 w-3.5" fill={s.priority ? "currentColor" : "none"} />
        </button>
      ) : (
        s.priority && <Star className="h-3.5 w-3.5 shrink-0 text-amber-500" fill="currentColor" aria-label="Priority" />
      )}
      <StatusBadge status={s.status} size="xs" />
    </div>
  );
}

// Editor inline date-setter: a small calendar chip that opens the native date
// picker; shows the date once set (grayed "Date" prompt when unset).
function DateChip({ value, onSet }: { value?: string | null; onSet: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const open = () => {
    const el = ref.current; if (!el) return;
    const withPicker = el as HTMLInputElement & { showPicker?: () => void };
    try { if (withPicker.showPicker) withPicker.showPicker(); else el.focus(); } catch { el.focus(); }
  };
  return (
    <span className="relative inline-flex shrink-0 items-center" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <button type="button" onClick={(e) => { e.stopPropagation(); open(); }}
        title={value ? `Target date: ${targetDateLabel(value)} — click to change` : "Set a target date"}
        aria-label={value ? `Change target date (currently ${targetDateLabel(value)})` : "Set a target date"}
        className={`inline-flex items-center gap-0.5 rounded px-1 py-px text-[9px] font-semibold transition ${value ? "text-slate-600 hover:text-accent dark:text-slate-300" : "text-slate-400 hover:text-accent"}`}>
        <Calendar className="h-3 w-3" aria-hidden="true" /> {value ? targetDateLabel(value) : "Date"}
      </button>
      <input ref={ref} type="date" value={value || ""}
        onChange={(e) => { e.stopPropagation(); onSet(e.target.value); }}
        className="absolute bottom-0 left-1/2 h-px w-px opacity-0" tabIndex={-1} aria-hidden="true" />
    </span>
  );
}

// The visual body of a project card (shared by the interactive chip + drag overlay).
function ProjectChipBody({ p }: { p: FloorProject }) {
  const color = statusColor(p.status);
  const author = formatAuthor(p.created_by);
  const due = dueState(p.target_date);
  const openNotes = p.open_notes ?? 0;
  return (
    <>
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
      {openNotes > 0 && (
        <span className="shrink-0 text-rose-600"
          title={`${openNotes} open note${openNotes === 1 ? "" : "s"} from Hanz`}
          aria-label={`${openNotes} open note${openNotes === 1 ? "" : "s"}`}>
          <Flag className="h-3.5 w-3.5" fill="currentColor" />
        </span>
      )}
      {due ? (
        <span className="shrink-0 text-rose-600" aria-label={due === "today" ? "Due today" : "Overdue"}
          title={due === "today" ? `Due today (${targetDateLabel(p.target_date)})` : `Overdue — was ${targetDateLabel(p.target_date)}`}>
          <AlertCircle className="h-4 w-4" fill="currentColor" stroke="white" strokeWidth={2.5} />
        </span>
      ) : (
        <span className="ml-1 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block break-words leading-snug text-xs font-bold text-slate-800 dark:text-slate-100">{p.title}</span>
        <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{statusLabel(p.status)}</span>
        {author && <span className="block truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">added by {author}</span>}
      </span>
    </>
  );
}

// A division sub-project. Clicking opens its sub-process drawer; hover reveals
// edit/delete (editors). Editors can DRAG it onto another Division to reassign it
// (dnd-kit; the card lifts into a free-floating DragOverlay, unclipped).
function ProjectChip({ p, divisionId, canEdit, onOpen, onEdit, onDelete, onToggleStar, onSetDate }: {
  p: FloorProject; divisionId: string; canEdit: boolean; onOpen: () => void; onEdit: () => void; onDelete: () => void;
  onToggleStar: () => void; onSetDate: (v: string) => void;
}) {
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: p.id, data: { project: p, divisionId }, disabled: !canEdit,
  });
  return (
    <div
      ref={setNodeRef}
      {...(canEdit ? listeners : {})}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={cardKeyDown(onOpen)}
      title={canEdit ? `${p.title} — click to open, or drag to another division` : `${p.title} — click to see its sub-process`}
      aria-label={`Open the ${p.title} sub-process`}
      className={`group relative flex touch-none items-center gap-2 overflow-hidden rounded-md bg-[#efe9df] px-2.5 py-2 text-left shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] outline-none transition duration-150 before:absolute before:-left-3 before:top-1/2 before:h-px before:w-3 before:bg-slate-400/70 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent dark:bg-slate-800 dark:before:bg-slate-500/70 ${canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${isDragging ? "opacity-30" : p.priority ? "ring-1 ring-amber-400/70" : ""}`}
    >
      <ProjectChipBody p={p} />
      {canEdit ? (
        <DateChip value={p.target_date} onSet={onSetDate} />
      ) : (
        p.target_date && (
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded px-1 py-px text-[9px] font-semibold text-slate-500 dark:text-slate-400"
            title={`Target date: ${targetDateLabel(p.target_date)}`}>
            <Calendar className="h-3 w-3" aria-hidden="true" /> {targetDateLabel(p.target_date)}
          </span>
        )
      )}
      {p.version && <VersionPill label={p.version} status={p.status} />}
      {canEdit ? (
        <button type="button"
          title={p.priority ? "Unstar (remove priority)" : "Star as priority — do this next"}
          aria-label={p.priority ? `Unstar ${p.title}` : `Star ${p.title} as priority`}
          aria-pressed={p.priority}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
          className={`shrink-0 rounded p-0.5 transition ${p.priority ? "text-amber-500" : "text-slate-400 hover:text-amber-500"}`}>
          <Star className="h-3.5 w-3.5" fill={p.priority ? "currentColor" : "none"} />
        </button>
      ) : (
        p.priority && <Star className="h-3.5 w-3.5 shrink-0 text-amber-500" fill="currentColor" aria-label="Priority" />
      )}
      {canEdit && (
        <span onPointerDown={(e) => e.stopPropagation()}>
          <CardControls onEdit={onEdit} onDelete={onDelete} editLabel={`Edit ${p.title}`} deleteLabel={`Delete ${p.title}`} />
        </span>
      )}
    </div>
  );
}

// The free-floating card shown under the cursor while dragging (rendered by
// DragOverlay at the document root, so no container clips it).
function DragCard({ label }: { label: string }) {
  return (
    <div className="relative flex w-72 max-w-[80vw] cursor-grabbing items-center gap-2 overflow-hidden rounded-md bg-[#efe9df] px-3 py-2 text-left shadow-2xl ring-2 ring-accent dark:bg-slate-800">
      <span className="break-words text-xs font-bold text-slate-800 dark:text-slate-100">{label}</span>
    </div>
  );
}

// One division column: a droppable target. Any project card from another
// division dropped here is reassigned to it.
function DivisionColumn({
  d, projects, salesId, filter, isAdmin, canEdit, open,
  onOpenProject, onAddProject, onEditProject, onDeleteProject, onToggleStar, onSetDate,
  onOpenSystem, onToggleSystemStar, onEditDivision, onDeleteDivision,
}: {
  d: SystemSummary; projects: SystemSummary[]; salesId?: string; filter: FilterKey; isAdmin: boolean; canEdit: boolean;
  open: (slug: string) => void;
  onOpenProject: (p: FloorProject, accent: string) => void;
  onAddProject: (d: SystemSummary) => void;
  onEditProject: (p: FloorProject, d: SystemSummary) => void;
  onDeleteProject: (p: FloorProject, d: SystemSummary) => void;
  onToggleStar: (p: FloorProject) => void;
  onSetDate: (p: FloorProject, date: string) => void;
  onOpenSystem: (s: SystemSummary) => void;
  onToggleSystemStar: (s: SystemSummary) => void;
  onEditDivision: (d: SystemSummary) => void;
  onDeleteDivision: (d: SystemSummary) => void;
}) {
  const { setNodeRef, isOver, active } = useDroppable({ id: d.id, data: { division: d } });
  // A tool tile shows under its assigned division_id; null falls back to the
  // default home (Sales & Marketing), preserving the prior placement.
  const systemSubs = projects.filter((p) => (p.division_id ?? salesId) === d.id);
  const allProjects = d.all_projects ?? [];
  const done = systemSubs.filter((s) => s.status === "live").length + allProjects.filter((p) => p.status === "live").length;
  const total = systemSubs.length + allProjects.length;
  const sysMatch = (s: SystemSummary) => filter === "all" ? true : filter === "priority" ? !!s.priority : s.status === filter;
  const shownSystems = systemSubs.filter(sysMatch).slice().sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));
  const projMatch = (p: FloorProject) => filter === "all" ? true : filter === "priority" ? !!p.priority : p.status === filter;
  // Flagged (open notes from Hanz) float to the very top, then starred, then the rest.
  const byFlagThenStar = (a: FloorProject, b: FloorProject) =>
    (((b.open_notes ?? 0) > 0 ? 1 : 0) - ((a.open_notes ?? 0) > 0 ? 1 : 0))
    || ((b.priority ? 1 : 0) - (a.priority ? 1 : 0));
  // No pagination — show every matching project, flagged/starred first; the board scrolls.
  const shownProjects = allProjects.filter(projMatch).slice().sort(byFlagThenStar);
  const hasChildren = shownSystems.length > 0 || shownProjects.length > 0;
  // Highlight only when a card from a DIFFERENT division is hovering this column.
  const activeDivId = active?.data.current?.divisionId as string | undefined;
  const isDropTarget = !!active && activeDivId !== d.id && isOver;
  return (
    <div ref={setNodeRef}
      className={`flex min-h-0 flex-col rounded-xl p-1 transition ${isDropTarget ? "bg-accent/10 ring-2 ring-accent" : ""}`}>
      <DeptBox s={d} onOpen={open} subDone={done} subTotal={total}
        isAdmin={isAdmin} canEdit={canEdit} onAddProject={() => onAddProject(d)}
        onEdit={() => onEditDivision(d)} onDelete={() => onDeleteDivision(d)} />
      {hasChildren && (
        <div className="mt-0 flex flex-col">
          <div className="mx-auto h-3 w-px bg-slate-400/70 dark:bg-slate-500/70" />
          <div className="relative ml-3 flex flex-col gap-2 border-l border-slate-400/70 pl-3 dark:border-slate-500/70">
            {shownSystems.map((p) => (
              <ProjectSubBox key={p.id} s={p} divisionId={d.id} canEdit={canEdit}
                onOpen={onOpenSystem} onToggleStar={() => onToggleSystemStar(p)} />
            ))}
            {shownProjects.map((p) => (
              <ProjectChip key={p.id} p={p} divisionId={d.id} canEdit={canEdit}
                onOpen={() => onOpenProject(p, accentOf(d))}
                onEdit={() => onEditProject(p, d)} onDelete={() => onDeleteProject(p, d)}
                onToggleStar={() => onToggleStar(p)}
                onSetDate={(v) => onSetDate(p, v)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FloorPlan({
  hub,
  departments,
  projects,
  isAdmin,
  canEdit,
  onOpenProject,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onToggleStar,
  onSetDate,
  onMoveProject,
  onMoveSystem,
  onOpenSystem,
  onToggleSystemStar,
  onEditDivision,
  onDeleteDivision,
}: {
  hub?: SystemSummary;
  departments: SystemSummary[];
  projects: SystemSummary[];
  isAdmin: boolean;
  canEdit: boolean;
  onOpenProject: (p: FloorProject, accent: string) => void;
  onAddProject: (d: SystemSummary) => void;
  onEditProject: (p: FloorProject, d: SystemSummary) => void;
  onDeleteProject: (p: FloorProject, d: SystemSummary) => void;
  onToggleStar: (p: FloorProject) => void;
  onSetDate: (p: FloorProject, date: string) => void;
  onMoveProject: (p: FloorProject, targetDivision: SystemSummary) => void;
  onMoveSystem: (s: SystemSummary, targetDivision: SystemSummary) => void;
  onOpenSystem: (s: SystemSummary) => void;
  onToggleSystemStar: (s: SystemSummary) => void;
  onEditDivision: (d: SystemSummary) => void;
  onDeleteDivision: (d: SystemSummary) => void;
}) {
  const nav = useNavigate();
  const open = (slug: string) => nav(`/floor/${slug}`);
  const [filter, setFilter] = useState<FilterKey>("all");
  // Free-flowing Kanban drag (dnd-kit). `activeLabel` drives the DragOverlay.
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  // A tool tile with no division_id defaults to Sales & Marketing's column.
  const salesId = departments.find((d) => d.slug === SALES_SLUG)?.id;
  // 8px activation distance so a plain click still opens the drawer.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  // Back-to-top: shown once the board is scrolled a bit.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTop, setShowTop] = useState(false);
  const HubIcon = hub ? iconOf(hub.slug) : Sparkles;

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current;
    setActiveLabel((data?.project?.title as string) ?? (data?.system?.name as string) ?? null);
  };
  const onDragEnd = (e: DragEndEvent) => {
    const data = e.active.data.current;
    const sourceDivId = data?.divisionId as string | undefined;
    const targetDivision = e.over?.data.current?.division as SystemSummary | undefined;
    setActiveLabel(null);
    if (!targetDivision || targetDivision.id === sourceDivId) return;
    if (data?.kind === "system" && data?.system) onMoveSystem(data.system as SystemSummary, targetDivision);
    else if (data?.project) onMoveProject(data.project as FloorProject, targetDivision);
  };

  return (
    <div className="relative flex h-full w-full flex-col rounded-2xl bg-slate-300 p-3 shadow-[0_18px_50px_-18px_rgba(15,23,42,0.45)] ring-1 ring-slate-400/50 dark:bg-slate-700 dark:ring-slate-600">
      {hub && (
        <button
          type="button"
          onClick={() => open(hub.slug)}
          title={hub.summary || `Open ${hub.name}`}
          className="group relative flex w-full shrink-0 items-stretch gap-3 overflow-hidden rounded-lg bg-[#efe9df] text-left outline-none transition duration-150 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-accent dark:bg-slate-800"
        >
          <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: accentOf(hub) }} />
          <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-2.5 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Treadwell HQ · AI Implementation</div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="truncate text-base font-extrabold text-slate-800 dark:text-slate-100">{hub.name}</span>
              <StatusBadge status={hub.status} size="xs" />
            </div>
            {hub.summary && <p className="mt-1 line-clamp-1 max-w-xl text-xs text-slate-500 dark:text-slate-400">{hub.summary}</p>}
          </div>
          <div className="hidden w-24 shrink-0 items-center justify-center sm:flex">
            <HubIcon className="h-8 w-8 opacity-25" strokeWidth={1.5} style={{ color: accentOf(hub) }} aria-hidden="true" />
          </div>
        </button>
      )}

      <div className="flex shrink-0 flex-wrap items-center gap-1.5 px-1 pb-2 pt-2">
        <span className="mr-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Filter</span>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const dot = f.key !== "all" && f.key !== "priority" ? STATUS_VAR[f.key as keyof typeof STATUS_VAR] : undefined;
          return (
            <button key={f.key} type="button" aria-pressed={active}
              onClick={() => setFilter(f.key)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${active ? "border-accent bg-accent/15 text-accent" : "border-slate-400/50 text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"}`}>
              {dot && <span className="inline-block h-2 w-2 rounded-full" style={{ background: dot }} aria-hidden="true" />}
              {f.key === "priority" && <Star className="h-3 w-3" fill={active ? "currentColor" : "none"} aria-hidden="true" />}
              {f.label}
            </button>
          );
        })}
        {canEdit && (
          <span className="ml-auto hidden text-[11px] text-slate-500 dark:text-slate-400 sm:inline">
            Tip: drag a project or tool onto another division to move it
          </span>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={pointerWithin}
        onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveLabel(null)}>
        <div ref={scrollRef} onScroll={(e) => setShowTop(e.currentTarget.scrollTop > 400)} className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-full flex-col">
            <div className={`grid grid-cols-2 items-start gap-3 ${COL_CLASS[departments.length] ?? "sm:grid-cols-6"}`}>
              {departments.map((d) => (
                <DivisionColumn key={d.id} d={d} projects={projects} salesId={salesId} filter={filter}
                  isAdmin={isAdmin} canEdit={canEdit} open={open}
                  onOpenProject={onOpenProject} onAddProject={onAddProject}
                  onEditProject={onEditProject} onDeleteProject={onDeleteProject}
                  onToggleStar={onToggleStar} onSetDate={onSetDate}
                  onOpenSystem={onOpenSystem} onToggleSystemStar={onToggleSystemStar}
                  onEditDivision={onEditDivision} onDeleteDivision={onDeleteDivision} />
              ))}
            </div>
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeLabel ? <DragCard label={activeLabel} /> : null}
        </DragOverlay>
      </DndContext>

      {showTop && (
        <button type="button" onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top" title="Back to top"
          className="absolute bottom-5 right-5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
