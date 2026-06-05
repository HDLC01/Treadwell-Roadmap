import { useNavigate } from "react-router-dom";
import { DoorOpen } from "lucide-react";
import type { SystemSummary } from "../lib/types";
import TopDownRoom from "./TopDownRoom";
import StatusBadge from "./StatusBadge";

// Concrete hex per status (canvas can't read CSS vars) — mirrors index.css.
const STATUS_HEX: Record<string, string> = {
  live: "#16a34a", in_progress: "#d97706", planned: "#2563eb", not_started: "#94a3b8",
};

function accentOf(s: SystemSummary): string {
  return s.accent && s.accent.startsWith("#") ? s.accent : "#475569";
}

// One office that fills its grid cell. Label + room (fills) + progress.
function Room({ s, onOpen }: { s: SystemSummary; onOpen: (slug: string) => void }) {
  const accent = accentOf(s);
  const working = s.status === "in_progress" || s.status === "live";
  const done = s.live_item_count;
  const total = s.item_count;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const kindLabel = s.kind === "division" ? "Division" : "System";
  return (
    <button
      type="button"
      onClick={() => onOpen(s.slug)}
      title={s.summary || `Open ${s.name}`}
      className="group relative flex min-h-0 flex-col overflow-hidden rounded-md bg-[#efe9df] text-left shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] outline-none transition duration-150 hover:z-10 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="h-1.5 w-full shrink-0" style={{ background: accent }} />
      <div className="flex shrink-0 items-center justify-between gap-1 px-2.5 pt-1 pb-0.5">
        <span className="truncate text-[13px] font-bold text-slate-800">{s.name}</span>
        <span className="shrink-0"><StatusBadge status={s.status} size="xs" /></span>
      </div>
      <div className="relative min-h-0 w-full flex-1">
        <TopDownRoom accent={accent} dept={s.slug} working={working} statusColor={STATUS_HEX[s.status] || "#94a3b8"} />
      </div>
      <div className="shrink-0 px-2.5 pb-1.5 pt-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
        </div>
        <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-slate-500">
          <span>{total ? `${done}/${total} done · ${kindLabel}` : `${kindLabel} · planning`}</span>
          <span className="inline-flex items-center gap-0.5 text-slate-400 transition group-hover:text-slate-700">
            <DoorOpen className="h-3 w-3" /> enter
          </span>
        </div>
      </div>
    </button>
  );
}

// The whole floor fills the area under the header (pure CSS, no scroll):
// the AI Implementation reception banner on top, then six offices in a 3×2
// grid that fills the remaining height.
export default function FloorPlan({ hub, rooms }: { hub?: SystemSummary; rooms: SystemSummary[] }) {
  const nav = useNavigate();
  const open = (slug: string) => nav(`/floor/${slug}`);

  return (
    <div className="flex h-full w-full flex-col rounded-2xl bg-slate-300 p-2 shadow-[0_18px_50px_-18px_rgba(15,23,42,0.45)] ring-1 ring-slate-400/50 dark:bg-slate-700 dark:ring-slate-600">
      {/* ── reception / HQ — AI Implementation banner ── */}
      {hub && (
        <button
          type="button"
          onClick={() => open(hub.slug)}
          title={hub.summary || `Open ${hub.name}`}
          className="group relative flex w-full shrink-0 items-stretch gap-3 overflow-hidden rounded-md bg-[#efe9df] text-left outline-none transition duration-150 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: accentOf(hub) }} />
          <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-2.5 pt-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reception · Treadwell HQ</div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="truncate text-base font-extrabold text-slate-800">{hub.name}</span>
              <StatusBadge status={hub.status} size="xs" />
            </div>
            {hub.summary && <p className="mt-1 line-clamp-2 max-w-xl text-xs text-slate-500">{hub.summary}</p>}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 w-40 overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full" style={{ width: `${hub.item_count ? Math.round((hub.live_item_count / hub.item_count) * 100) : 0}%`, background: accentOf(hub) }} />
              </div>
              <span className="text-[11px] font-medium text-slate-500">{hub.live_item_count}/{hub.item_count} shipped · the whole program</span>
            </div>
          </div>
          <div className="relative hidden w-56 shrink-0 sm:block lg:w-72">
            <TopDownRoom accent={accentOf(hub)} dept={hub.slug} working statusColor={STATUS_HEX[hub.status] || "#94a3b8"} />
          </div>
        </button>
      )}

      {/* ── hallway label ── */}
      <div className="my-1.5 flex shrink-0 items-center gap-2 px-0.5">
        <span className="h-px flex-1 bg-slate-400/60 dark:bg-slate-500/60" />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-300">Hallway · {rooms.length} offices</span>
        <span className="h-px flex-1 bg-slate-400/60 dark:bg-slate-500/60" />
      </div>

      {/* ── offices — 3×2 grid filling the rest of the floor ── */}
      <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-2 gap-2">
        {rooms.map((s) => <Room key={s.id} s={s} onOpen={open} />)}
      </div>
    </div>
  );
}
