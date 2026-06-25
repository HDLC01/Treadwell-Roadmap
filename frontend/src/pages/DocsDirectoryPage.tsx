import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, FileText, Library, Radar, BarChart3, Megaphone,
  HardHat, Server, Sparkles, Building2, type LucideIcon,
} from "lucide-react";
import { getSystems, getSystem } from "../lib/api";
import type { DocIndexEntry, SystemSummary } from "../lib/types";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";

// Same slug→icon mapping the floor plan uses, so a project's icon is consistent
// across the office view and the documentation directory.
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

const accentOf = (s: SystemSummary): string =>
  s.accent && s.accent.startsWith("#") ? s.accent : "#475569";

// A system plus the SOP / dev-doc counts we resolved from its detail.
type DocEntry = { system: SystemSummary; sopCount: number; devCount: number };

export default function DocsDirectoryPage() {
  const [entries, setEntries] = useState<DocEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { systems } = await getSystems();
        // The /systems list carries no doc count, so resolve each system's docs
        // from its detail (in parallel) and keep only those that actually have
        // documentation. This is data-driven — no hard-coded slug list.
        const detailed = await Promise.all(
          systems.map(async (s) => {
            try {
              const detail = await getSystem(s.slug);
              return { system: s, docs: detail.docs ?? [] };
            } catch {
              return { system: s, docs: [] as DocIndexEntry[] };
            }
          }),
        );
        if (cancelled) return;
        const withDocs = detailed
          .filter((d) => d.docs.length > 0)
          .map((d) => ({
            system: d.system,
            sopCount: d.docs.filter((x) => x.kind === "sop").length,
            devCount: d.docs.filter((x) => x.kind === "dev_doc").length,
          }))
          .sort((a, b) => a.system.ordering - b.system.ordering);
        setEntries(withDocs);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const count = useMemo(() => entries.length, [entries]);

  if (loading) return <PageSkeleton />;
  if (error) {
    return (
      <EmptyState
        title="Couldn't load the documentation directory"
        message="Make sure you're signed in and the server is reachable."
        icon={Library}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Library className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
        <h1 className="text-lg font-extrabold tracking-tight text-fg sm:text-xl">
          SOP &amp; Documentation
        </h1>
        {count > 0 && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">
            {count} {count === 1 ? "project" : "projects"}
          </span>
        )}
      </div>
      <p className="max-w-2xl text-sm text-muted">
        Pick a project to open its plain-language Standard Operating Procedure and its
        developer documentation.
      </p>

      {count === 0 ? (
        <EmptyState
          title="No documentation yet"
          message="Once a project has an SOP or developer docs, it'll show up here."
          icon={BookOpen}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(({ system, sopCount, devCount }) => (
            <DirectoryCard key={system.id} system={system} sopCount={sopCount} devCount={devCount} />
          ))}
        </div>
      )}
    </div>
  );
}

function DirectoryCard({ system, sopCount, devCount }: {
  system: SystemSummary; sopCount: number; devCount: number;
}) {
  const accent = accentOf(system);
  const Icon = iconOf(system.slug);
  return (
    <Link
      to={`/floor/${system.slug}/sop`}
      title={system.summary || `Open ${system.name} documentation`}
      aria-label={`Open the ${system.name} SOP and documentation`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface text-left outline-none transition duration-150 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-accent"
    >
      <span className="h-1.5 w-full shrink-0" style={{ background: accent }} aria-hidden="true" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
            style={{ background: `color-mix(in srgb, ${accent} 14%, transparent)` }}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} style={{ color: accent }} aria-hidden="true" />
          </span>
          <StatusBadge status={system.status} size="xs" />
        </div>
        <h2 className="mt-3 truncate text-base font-bold text-fg">{system.name}</h2>
        {system.summary && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{system.summary}</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs font-medium text-muted">
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            {sopCount} {sopCount === 1 ? "SOP page" : "SOP pages"}
          </span>
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            {devCount} {devCount === 1 ? "doc page" : "doc pages"}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 font-semibold text-accent transition group-hover:underline">
            Open
          </span>
        </div>
      </div>
    </Link>
  );
}
