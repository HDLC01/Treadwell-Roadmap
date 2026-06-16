import { useNavigate } from "react-router-dom";
import {
  DoorOpen, Radar, BarChart3, Megaphone, HardHat, Server,
  FileText, Sparkles, Building2, type LucideIcon,
} from "lucide-react";
import type { SystemSummary } from "../lib/types";
import StatusBadge from "./StatusBadge";

const SALES_SLUG = "sales-marketing"; // the department the shipped systems hang under

function accentOf(s: SystemSummary): string {
  return s.accent && s.accent.startsWith("#") ? s.accent : "#475569";
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

// A department box — the org-chart parent node.
function DeptBox({ s, onOpen }: { s: SystemSummary; onOpen: (slug: string) => void }) {
  const accent = accentOf(s);
  const done = s.live_item_count;
  const total = s.item_count;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const Icon = iconOf(s.slug);
  return (
    <button
      type="button"
      onClick={() => onOpen(s.slug)}
      title={s.summary || `Open ${s.name}`}
      aria-label={`Open the ${s.name} roadmap`}
      className="group relative flex h-44 flex-col overflow-hidden rounded-lg bg-[#efe9df] text-left shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] outline-none transition duration-150 hover:z-10 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-accent dark:bg-slate-800"
    >
      <span className="h-1.5 w-full shrink-0" style={{ background: accent }} />
      <div className="flex shrink-0 items-center justify-between gap-1 px-3 pt-2">
        <span className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{s.name}</span>
        <span className="shrink-0"><StatusBadge status={s.status} size="xs" /></span>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center gap-2 px-3">
        <Icon className="h-14 w-14 opacity-20" strokeWidth={1.5} style={{ color: accent }} aria-hidden="true" />
      </div>
      <div className="shrink-0 px-3 pb-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-slate-500 dark:text-slate-400">
          <span>{total ? `${done}/${total} done · Department` : "Department · planning"}</span>
          <span className="inline-flex items-center gap-0.5 text-slate-400 transition group-hover:text-slate-700 dark:group-hover:text-slate-200">
            <DoorOpen className="h-3 w-3" /> open
          </span>
        </div>
      </div>
    </button>
  );
}

// A shipped-system child node, hung under its department with an org-chart tick
// (the ::before draws the horizontal connector from the column's left rail).
function ProjectSubBox({ s, onOpen }: { s: SystemSummary; onOpen: (slug: string) => void }) {
  const accent = accentOf(s);
  const done = s.live_item_count;
  const total = s.item_count;
  const Icon = iconOf(s.slug);
  return (
    <button
      type="button"
      onClick={() => onOpen(s.slug)}
      title={s.summary || `Open ${s.name}`}
      aria-label={`Open the ${s.name} roadmap`}
      className="group relative flex items-center gap-2 overflow-hidden rounded-md bg-[#efe9df] px-2.5 py-2 text-left shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)] outline-none transition duration-150 before:absolute before:-left-3 before:top-1/2 before:h-px before:w-3 before:bg-slate-400/70 hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent dark:bg-slate-800 dark:before:bg-slate-500/70"
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} />
      <Icon className="ml-1 h-4 w-4 shrink-0 opacity-60" strokeWidth={1.5} style={{ color: accent }} aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-100">{s.name.split(" — ")[0]}</span>
        <span className="block text-[10px] text-slate-500 dark:text-slate-400">{total ? `${done}/${total} done` : "planning"}</span>
      </span>
      <StatusBadge status={s.status} size="xs" />
    </button>
  );
}

// The overview as an ORG CHART: AI Implementation (HQ) on top, the four
// departments as boxes, and the shipped systems hung under Sales & Marketing.
export default function FloorPlan({
  hub,
  departments,
  projects,
}: {
  hub?: SystemSummary;
  departments: SystemSummary[];
  projects: SystemSummary[];
}) {
  const nav = useNavigate();
  const open = (slug: string) => nav(`/floor/${slug}`);
  const HubIcon = hub ? iconOf(hub.slug) : Sparkles;

  return (
    <div className="flex h-full w-full flex-col rounded-2xl bg-slate-300 p-3 shadow-[0_18px_50px_-18px_rgba(15,23,42,0.45)] ring-1 ring-slate-400/50 dark:bg-slate-700 dark:ring-slate-600">
      {/* ── AI Implementation (HQ) ── */}
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
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${hub.item_count ? Math.round((hub.live_item_count / hub.item_count) * 100) : 0}%`, background: accentOf(hub) }} />
              </div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{hub.live_item_count}/{hub.item_count} shipped · the whole program</span>
            </div>
          </div>
          <div className="hidden w-24 shrink-0 items-center justify-center sm:flex">
            <HubIcon className="h-8 w-8 opacity-25" strokeWidth={1.5} style={{ color: accentOf(hub) }} aria-hidden="true" />
          </div>
        </button>
      )}

      {/* org chart, centered in the remaining space */}
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <div className="mx-auto mb-1 h-4 w-px bg-slate-400/70 dark:bg-slate-500/70" />
        <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-4">
        {departments.map((d) => {
          const isSales = d.slug === SALES_SLUG && projects.length > 0;
          return (
            <div key={d.id} className="flex min-h-0 flex-col">
              <DeptBox s={d} onOpen={open} />
              {isSales && (
                <div className="mt-0 flex flex-col">
                  {/* drop from the department box */}
                  <div className="mx-auto h-3 w-px bg-slate-400/70 dark:bg-slate-500/70" />
                  {/* children with a left rail (org-chart branch) */}
                  <div className="relative ml-3 flex flex-col gap-2 border-l border-slate-400/70 pl-3 dark:border-slate-500/70">
                    {projects.map((p) => <ProjectSubBox key={p.id} s={p} onOpen={open} />)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
