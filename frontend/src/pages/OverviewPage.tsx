import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { getSystems } from "../lib/api";
import type { RoadmapItem, SystemSummary } from "../lib/types";
import { STATUS_LABELS, STATUS_VAR } from "../lib/format";
import FloorPlan from "../components/FloorPlan";
import FeatureDetailDrawer from "../components/FeatureDetailDrawer";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

export default function OverviewPage() {
  const [floors, setFloors] = useState<SystemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openItem, setOpenItem] = useState<{ item: RoadmapItem; accent: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSystems()
      .then((r) => { if (!cancelled) setFloors(r.systems); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const { departments, projects } = useMemo(() => {
    const byOrder = (a: SystemSummary, b: SystemSummary) => a.ordering - b.ordering;
    const hub = floors.find((f) => f.kind === "overview");
    const departments = floors.filter((f) => f.kind === "division").sort(byOrder);
    const projects = floors.filter((f) => f.kind === "system").sort(byOrder);
    return { hub, departments, projects };
  }, [floors]);

  if (loading) return <div className="p-6"><PageSkeleton /></div>;
  if (error) return <div className="p-6"><EmptyState title="Couldn't load the showcase" message="Make sure you're signed in and the server is reachable." /></div>;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* compact header — leaves maximum room for the office below */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 shrink-0 text-accent" />
          <h1 className="text-lg font-extrabold tracking-tight text-fg sm:text-xl">The virtual office</h1>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          {(["live", "in_progress", "planned", "not_started"] as const).map((s) => (
            <span key={s} className="inline-flex items-center gap-1 text-muted">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: STATUS_VAR[s] }} />
              {STATUS_LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      {/* the office floor fills the height under the header (largest size that
          fits, no scroll); width is capped so rooms aren't oversized */}
      <div className="min-h-0 flex-1 px-3 pb-3">
        <FloorPlan
          departments={departments}
          projects={projects}
          onOpenProject={(p, accent) => setOpenItem({ item: { ...p, is_feature: true, ordering: 0 } as RoadmapItem, accent })}
        />
      </div>

      <FeatureDetailDrawer
        item={openItem?.item ?? null}
        accent={openItem?.accent ?? "#475569"}
        onClose={() => setOpenItem(null)}
      />
    </div>
  );
}
