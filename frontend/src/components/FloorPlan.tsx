import { useState, useRef, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  DoorOpen, Radar, BarChart3, Megaphone, HardHat, Server,
  FileText, Sparkles, Building2, ExternalLink, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Pencil, Trash2, Plus, Star, Calendar, AlertCircle, type LucideIcon,
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

type FloorProject = { id: string; title: string; detail?: string | null; status: string; created_by?: string | null; priority?: boolean; target_date?: string | null; version?: string | null };

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
const PROJECTS_PER_PAGE = 5;          // expanded sub-project list paginates by this

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
function VersionBadges({ versions }: { versions?: SystemSummary["versions"] }) {
  if (!versions || versions.length === 0) return null;
  return (
    <span className="flex items-center gap-1">
      {versions.map((v) => <VersionPill key={v.version_num} label={v.label} status={v.status} />)}
    </span>
  );
}

// Hover-revealed edit/delete cluster (admin-only). Stops propagation so it never
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

// A department box — the org-chart parent node.
function DeptBox({ s, onOpen, subDone, subTotal, isAdmin, onAddProject, onEdit, onDelete }: {
  s: SystemSummary; onOpen: (slug: string) => void; subDone: number; subTotal: number;
  isAdmin: boolean; onAddProject: () => void; onEdit: () => void; onDelete: () => void;
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
        {isAdmin && (
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
// shows the system's own version(s). Managed on its own floor page (no CRUD here).
function ProjectSubBox({ s, isAdmin, onOpen, onToggleStar }: {
  s: SystemSummary; isAdmin: boolean; onOpen: (s: SystemSummary) => void; onToggleStar: () => void;
}) {
  const color = statusColor(s.status);
  const done = s.live_item_count;
  const total = s.item_count;
  const Icon = iconOf(s.slug);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(s)}
      onKeyDown={cardKeyDown(() => onOpen(s))}
      title={s.summary || `Open ${s.name}`}
      aria-label={`Open the ${s.name} details`}
      className={`group relative flex cursor-pointer items-center gap-2 overflow-hidden rounded-md bg-[#efe9df] px-2.5 py-2 text-left shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] outline-none transition duration-150 before:absolute before:-left-3 before:top-1/2 before:h-px before:w-3 before:bg-slate-400/70 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent dark:bg-slate-800 dark:before:bg-slate-500/70 ${s.priority ? "ring-1 ring-amber-400/70" : ""}`}
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
      <Icon className="ml-1 h-4 w-4 shrink-0 opacity-60" strokeWidth={1.5} style={{ color }} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-100">{s.name.split(" — ")[0]}</span>
        <span className="block text-[10px] text-slate-500 dark:text-slate-400">{total ? `${done}/${total} done` : "planning"}</span>
      </span>
      <VersionBadges versions={s.versions} />
      {s.live_url && (
        <a href={s.live_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
          className="shrink-0 rounded p-1 text-slate-400 transition hover:bg-black/5 hover:text-accent dark:hover:bg-white/10"
          title={`Open ${s.name} (live site)`} aria-label={`Open the ${s.name} live site in a new tab`}>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      {isAdmin ? (
        <button type="button"
          title={s.priority ? "Unstar (remove priority)" : "Star as priority — do this next"}
          aria-label={s.priority ? `Unstar ${s.name}` : `Star ${s.name} as priority`}
          aria-pressed={s.priority}
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

// Admin inline date-setter: a small calendar chip that opens the native date
// picker; shows the date once set (grayed "Date" prompt when unset).
function DateChip({ value, onSet }: { value?: string | null; onSet: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const open = () => {
    const el = ref.current; if (!el) return;
    const withPicker = el as HTMLInputElement & { showPicker?: () => void };
    try { if (withPicker.showPicker) withPicker.showPicker(); else el.focus(); } catch { el.focus(); }
  };
  return (
    <span className="relative inline-flex shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
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

// A division sub-project. Colored by STATUS; shows its version + "added by";
// clicking opens its sub-process drawer; hover reveals edit/delete (admin).
function ProjectChip({ p, isAdmin, onOpen, onEdit, onDelete, onToggleStar, onSetDate }: {
  p: FloorProject; isAdmin: boolean; onOpen: () => void; onEdit: () => void; onDelete: () => void;
  onToggleStar: () => void; onSetDate: (v: string) => void;
}) {
  const color = statusColor(p.status);
  const author = formatAuthor(p.created_by);
  const due = dueState(p.target_date);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={cardKeyDown(onOpen)}
      title={`${p.title} — click to see its sub-process`}
      aria-label={`Open the ${p.title} sub-process`}
      className={`group relative flex cursor-pointer items-center gap-2 overflow-hidden rounded-md bg-[#efe9df] px-2.5 py-2 text-left shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] outline-none transition duration-150 before:absolute before:-left-3 before:top-1/2 before:h-px before:w-3 before:bg-slate-400/70 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent dark:bg-slate-800 dark:before:bg-slate-500/70 ${p.priority ? "ring-1 ring-amber-400/70" : ""}`}
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: color }} />
      {due ? (
        <span className="shrink-0 text-rose-600" aria-label={due === "today" ? "Due today" : "Overdue"}
          title={due === "today" ? `Due today (${targetDateLabel(p.target_date)})` : `Overdue — was ${targetDateLabel(p.target_date)}`}>
          <AlertCircle className="h-4 w-4" fill="currentColor" stroke="white" strokeWidth={2.5} />
        </span>
      ) : (
        <span className="ml-1 inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden="true" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-100">{p.title}</span>
        <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{statusLabel(p.status)}</span>
        {author && <span className="block truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">added by {author}</span>}
      </span>
      {isAdmin ? (
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
      {isAdmin ? (
        <button type="button"
          title={p.priority ? "Unstar (remove priority)" : "Star as priority — do this next"}
          aria-label={p.priority ? `Unstar ${p.title}` : `Star ${p.title} as priority`}
          aria-pressed={p.priority}
          onClick={(e) => { e.stopPropagation(); onToggleStar(); }}
          className={`shrink-0 rounded p-0.5 transition ${p.priority ? "text-amber-500" : "text-slate-400 hover:text-amber-500"}`}>
          <Star className="h-3.5 w-3.5" fill={p.priority ? "currentColor" : "none"} />
        </button>
      ) : (
        p.priority && <Star className="h-3.5 w-3.5 shrink-0 text-amber-500" fill="currentColor" aria-label="Priority" />
      )}
      {isAdmin && <CardControls onEdit={onEdit} onDelete={onDelete} editLabel={`Edit ${p.title}`} deleteLabel={`Delete ${p.title}`} />}
    </div>
  );
}

export default function FloorPlan({
  hub,
  departments,
  projects,
  isAdmin,
  onOpenProject,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onToggleStar,
  onSetDate,
  onOpenSystem,
  onToggleSystemStar,
  onEditDivision,
  onDeleteDivision,
}: {
  hub?: SystemSummary;
  departments: SystemSummary[];
  projects: SystemSummary[];
  isAdmin: boolean;
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
  const nav = useNavigate();
  const open = (slug: string) => nav(`/floor/${slug}`);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<FilterKey>("all");
  const HubIcon = hub ? iconOf(hub.slug) : Sparkles;

  return (
    <div className="flex h-full w-full flex-col rounded-2xl bg-slate-300 p-3 shadow-[0_18px_50px_-18px_rgba(15,23,42,0.45)] ring-1 ring-slate-400/50 dark:bg-slate-700 dark:ring-slate-600">
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
              onClick={() => { setFilter(f.key); setPage({}); }}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${active ? "border-accent bg-accent/15 text-accent" : "border-slate-400/50 text-slate-600 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/10"}`}>
              {dot && <span className="inline-block h-2 w-2 rounded-full" style={{ background: dot }} aria-hidden="true" />}
              {f.key === "priority" && <Star className="h-3 w-3" fill={active ? "currentColor" : "none"} aria-hidden="true" />}
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col justify-center">
        <div className={`grid grid-cols-2 items-start gap-3 ${COL_CLASS[departments.length] ?? "sm:grid-cols-6"}`}>
        {departments.map((d) => {
          const systemSubs = d.slug === SALES_SLUG ? projects : [];
          const allProjects = d.all_projects ?? [];
          const isOpen = !!expanded[d.slug];
          const done = systemSubs.filter((s) => s.status === "live").length + allProjects.filter((p) => p.status === "live").length;
          const total = systemSubs.length + allProjects.length;
          const setPg = (n: number) => setPage((m) => ({ ...m, [d.slug]: n }));
          // Apply the active filter to both shipped-system children and project cards.
          const sysMatch = (s: SystemSummary) => filter === "all" ? true : filter === "priority" ? !!s.priority : s.status === filter;
          const shownSystems = systemSubs.filter(sysMatch).slice().sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));
          const projMatch = (p: FloorProject) => filter === "all" ? true : filter === "priority" ? !!p.priority : p.status === filter;
          const byPriority = (a: FloorProject, b: FloorProject) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0);
          const isFiltered = filter !== "all";
          // Unfiltered collapsed view = starred (any status) + in-progress, starred first.
          const collapsed = [...allProjects.filter((p) => p.priority),
                             ...allProjects.filter((p) => p.status === "in_progress" && !p.priority)];
          const listForView = (isFiltered ? allProjects.filter(projMatch) : (isOpen ? allProjects : collapsed)).slice().sort(byPriority);
          const pageable = isFiltered || isOpen;
          const pageCount = Math.max(1, Math.ceil(listForView.length / PROJECTS_PER_PAGE));
          const pg = Math.min(page[d.slug] ?? 0, pageCount - 1);
          const shownProjects = pageable ? listForView.slice(pg * PROJECTS_PER_PAGE, pg * PROJECTS_PER_PAGE + PROJECTS_PER_PAGE) : listForView;
          const hiddenCount = allProjects.length - collapsed.length; // extra cards behind "Show all" (unfiltered only)
          const hasChildren = shownSystems.length > 0 || shownProjects.length > 0;
          return (
            <div key={d.id} className="flex min-h-0 flex-col">
              <DeptBox s={d} onOpen={open} subDone={done} subTotal={total}
                isAdmin={isAdmin} onAddProject={() => onAddProject(d)}
                onEdit={() => onEditDivision(d)} onDelete={() => onDeleteDivision(d)} />
              {hasChildren && (
                <div className="mt-0 flex flex-col">
                  <div className="mx-auto h-3 w-px bg-slate-400/70 dark:bg-slate-500/70" />
                  <div className="relative ml-3 flex flex-col gap-2 border-l border-slate-400/70 pl-3 dark:border-slate-500/70">
                    {shownSystems.map((p) => (
                      <ProjectSubBox key={p.id} s={p} isAdmin={isAdmin}
                        onOpen={onOpenSystem} onToggleStar={() => onToggleSystemStar(p)} />
                    ))}
                    {shownProjects.map((p) => (
                      <ProjectChip key={p.id} p={p} isAdmin={isAdmin}
                        onOpen={() => onOpenProject(p, accentOf(d))}
                        onEdit={() => onEditProject(p, d)} onDelete={() => onDeleteProject(p, d)}
                        onToggleStar={() => onToggleStar(p)}
                        onSetDate={(v) => onSetDate(p, v)} />
                    ))}
                    {pageable && listForView.length > PROJECTS_PER_PAGE && (
                      <div className="flex items-center justify-between px-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <span>{pg * PROJECTS_PER_PAGE + 1}–{Math.min((pg + 1) * PROJECTS_PER_PAGE, listForView.length)} of {listForView.length}</span>
                        <span className="flex items-center gap-1">
                          <button type="button" disabled={pg <= 0} onClick={() => setPg(pg - 1)}
                            className="rounded border border-slate-400/60 p-0.5 transition hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/10" aria-label="Previous projects">
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" disabled={pg >= pageCount - 1} onClick={() => setPg(pg + 1)}
                            className="rounded border border-slate-400/60 p-0.5 transition hover:bg-black/5 disabled:opacity-40 dark:hover:bg-white/10" aria-label="More projects">
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      </div>
                    )}
                    {!isFiltered && hiddenCount > 0 && (
                      <button type="button"
                        onClick={() => { setExpanded((e) => ({ ...e, [d.slug]: !e[d.slug] })); setPg(0); }}
                        className="inline-flex items-center gap-1 self-start rounded-md px-1.5 py-1 text-[11px] font-semibold text-slate-600 outline-none transition hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-accent dark:text-slate-300 dark:hover:bg-white/10"
                        aria-expanded={isOpen}>
                        {isOpen
                          ? (<><ChevronUp className="h-3.5 w-3.5" /> Show fewer</>)
                          : (<><ChevronDown className="h-3.5 w-3.5" /> Show all {allProjects.length} projects</>)}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
        </div>
      </div>
    </div>
  );
}
