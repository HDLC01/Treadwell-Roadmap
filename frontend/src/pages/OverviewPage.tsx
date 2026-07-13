import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles, Plus } from "lucide-react";
import {
  getSystems, createFeature, updateItem, setItemStatus, setItemPriority, deleteItem, moveItem,
  createSystem, updateSystem, deleteSystem, setSystemPriority, moveSystem, unflagItem, unflagSystem,
} from "../lib/api";
import type { RoadmapItem, Status, SystemSummary } from "../lib/types";
import { STATUS_LABELS, STATUS_VAR } from "../lib/format";
import { useAuth } from "../lib/auth";
import FloorPlan from "../components/FloorPlan";
import FeatureDetailDrawer from "../components/FeatureDetailDrawer";
import EntityEditModal, { type EntityValues } from "../components/EntityEditModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { PageSkeleton } from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

type Proj = { id: string; title: string; detail?: string | null; status: string; created_by?: string | null; priority?: boolean; target_date?: string | null; open_notes?: number; version?: string | null };
type EditState =
  | { kind: "division"; mode: "create" | "edit"; division?: SystemSummary }
  | { kind: "project"; mode: "create" | "edit"; division: SystemSummary; project?: Proj };
type ConfirmState =
  | { kind: "division"; division: SystemSummary }
  | { kind: "project"; project: Proj };

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "division";

export default function OverviewPage() {
  // canEdit: any signed-in teammate may add / edit / star projects. isAdmin gates
  // only structural work (add / edit / delete divisions).
  const { isAdmin, canEdit } = useAuth();
  const [floors, setFloors] = useState<SystemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openItem, setOpenItem] = useState<{ item: RoadmapItem; accent: string; label?: string; boardSlug?: string; liveUrl?: string | null; focusNote?: boolean } | null>(null);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(() => getSystems().then((r) => setFloors(r.systems)), []);

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
    const byStar = (a: SystemSummary, b: SystemSummary) => (Number(b.priority) - Number(a.priority)) || byOrder(a, b);
    const departments = floors.filter((f) => f.kind === "division").sort(byOrder);
    const projects = floors.filter((f) => f.kind === "system").sort(byStar);
    return { departments, projects };
  }, [floors]);

  const accentOf = (d?: SystemSummary) => (d?.accent?.startsWith("#") ? d.accent : "#475569");
  // Tools with no division_id fall back to Sales & Marketing (matches FloorPlan).
  const salesId = departments.find((d) => d.slug === "sales-marketing")?.id;
  const toolsInDivision = (divId: string) => projects.filter((t) => (t.division_id ?? salesId) === divId);

  const saveEntity = async (v: EntityValues) => {
    if (!edit) return;
    setBusy(true); setNote(null);
    try {
      if (edit.kind === "division") {
        if (edit.mode === "create") {
          await createSystem({ slug: slugify(v.title), name: v.title, summary: v.summary, kind: "division", status: v.status, accent: v.accent });
        } else if (edit.division) {
          await updateSystem(edit.division.id, { name: v.title, summary: v.summary, status: v.status, accent: v.accent });
        }
      } else {
        if (edit.mode === "create") {
          const r = await createFeature(edit.division.id, { title: v.title, detail: v.detail, status: v.status });
          if (v.target_date && r?.id) await updateItem(r.id, { target_date: v.target_date });
        } else if (edit.project) {
          await updateItem(edit.project.id, { title: v.title, detail: v.detail, target_date: v.target_date ?? null });
          if (v.status !== edit.project.status) await setItemStatus(edit.project.id, v.status as Status);
          // File under a tool (or back to the division) if "Belongs to" changed.
          if (v.belongs_to && v.belongs_to !== edit.division.id) await moveItem(edit.project.id, v.belongs_to);
        }
      }
      await load();
      setEdit(null);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Couldn't save — try again.");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!confirm) return;
    setBusy(true); setNote(null);
    try {
      if (confirm.kind === "division") await deleteSystem(confirm.division.id);
      else await deleteItem(confirm.project.id);
      await load();
      setConfirm(null);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Couldn't delete — try again.");
    } finally {
      setBusy(false);
    }
  };

  const toggleStar = async (p: Proj) => {
    setNote(null);
    try {
      await setItemPriority(p.id, !p.priority);
      await load();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Couldn't update the priority — try again.");
    }
  };

  const toggleSystemStar = async (s: SystemSummary) => {
    setNote(null);
    try {
      await setSystemPriority(s.id, !s.priority);
      await load();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Couldn't update the priority — try again.");
    }
  };

  const setProjectDate = async (p: Proj, date: string) => {
    setNote(null);
    try {
      await updateItem(p.id, { target_date: date || null });
      await load();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Couldn't set the date — try again.");
    }
  };

  // Kanban move: reassign a project card to another division (its system_id).
  const moveProject = async (p: Proj, targetDivision: SystemSummary) => {
    setNote(null);
    try {
      await moveItem(p.id, targetDivision.id);
      await load();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Couldn't move the project — try again.");
    }
  };

  // Move a Live tool tile to another division on the home board.
  const moveSystemTo = async (s: SystemSummary, targetDivision: SystemSummary) => {
    setNote(null);
    try {
      await moveSystem(s.id, targetDivision.id);
      await load();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Couldn't move the tool — try again.");
    }
  };

  // File a subprocess card under a tool (drag onto the tool tile) — sets its system_id.
  const fileUnderTool = async (p: Proj, tool: SystemSummary) => {
    setNote(null);
    try {
      await moveItem(p.id, tool.id);
      await load();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Couldn't file it under that tool — try again.");
    }
  };

  // Unflag (admin): resolve the entity's open flags so its red flag clears.
  const unflagProject = async (p: Proj) => {
    setNote(null);
    try { await unflagItem(p.id); await load(); }
    catch (e) { setNote(e instanceof Error ? e.message : "Couldn't unflag it — try again."); }
  };
  const unflagSystemTile = async (s: SystemSummary) => {
    setNote(null);
    try { await unflagSystem(s.id); await load(); }
    catch (e) { setNote(e instanceof Error ? e.message : "Couldn't unflag it — try again."); }
  };

  const openSystem = (s: SystemSummary, focusNote = false) => setOpenItem({
    item: { id: s.id, title: s.name, detail: s.summary ?? null, status: s.status, is_feature: true, ordering: 0, created_at: s.created_at ?? null } as RoadmapItem,
    accent: accentOf(s), label: "Tool", boardSlug: s.slug, liveUrl: s.live_url ?? null, focusNote,
  });

  if (loading) return <div className="p-6"><PageSkeleton /></div>;
  if (error) return <div className="p-6"><EmptyState title="Couldn't load the showcase" message="Make sure you're signed in and the server is reachable." /></div>;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 shrink-0 text-accent" />
          <h1 className="text-lg font-extrabold tracking-tight text-fg sm:text-xl">The virtual office</h1>
          {isAdmin && (
            <button type="button" onClick={() => setEdit({ kind: "division", mode: "create" })}
              className="ml-1 inline-flex items-center gap-1 rounded-lg border border-accent/40 px-2 py-1 text-xs font-semibold text-accent transition hover:bg-accent/10">
              <Plus className="h-3.5 w-3.5" /> Add division
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          {(["live", "in_progress", "planned", "not_started"] as const).map((s) => (
            <span key={s} className="inline-flex items-center gap-1 text-muted">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: STATUS_VAR[s] }} />
              {STATUS_LABELS[s]}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 text-muted">
            <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sky-600 dark:text-sky-400">New</span>
            Updated this week
          </span>
        </div>
      </div>

      {note && (
        <div className="mx-4 mb-1 shrink-0 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{note}</div>
      )}

      <div className="min-h-0 flex-1 px-3 pb-3">
        <FloorPlan
          departments={departments}
          projects={projects}
          isAdmin={isAdmin}
          canEdit={canEdit}
          onOpenProject={(p, accent, focusNote) => setOpenItem({ item: { ...p, is_feature: true, ordering: 0 } as RoadmapItem, accent, label: "Feature", focusNote })}
          onAddProject={(d) => setEdit({ kind: "project", mode: "create", division: d })}
          onEditProject={(p, d) => setEdit({ kind: "project", mode: "edit", division: d, project: p })}
          onDeleteProject={(p) => setConfirm({ kind: "project", project: p })}
          onToggleStar={(p) => toggleStar(p)}
          onSetDate={(p, date) => setProjectDate(p, date)}
          onMoveProject={(p, d) => moveProject(p, d)}
          onMoveSystem={(s, d) => moveSystemTo(s, d)}
          onFileUnderTool={(p, t) => fileUnderTool(p, t)}
          onUnflagProject={(p) => unflagProject(p)}
          onUnflagSystem={(s) => unflagSystemTile(s)}
          onOpenSystem={(s, focusNote) => openSystem(s, focusNote)}
          onToggleSystemStar={(s) => toggleSystemStar(s)}
          onEditDivision={(d) => setEdit({ kind: "division", mode: "edit", division: d })}
          onDeleteDivision={(d) => setConfirm({ kind: "division", division: d })}
        />
      </div>

      <FeatureDetailDrawer
        item={openItem?.item ?? null}
        accent={openItem?.accent ?? "#475569"}
        label={openItem?.label}
        boardSlug={openItem?.boardSlug}
        liveUrl={openItem?.liveUrl}
        canAddNote={canEdit}
        canManageNotes={isAdmin}
        focusNote={openItem?.focusNote}
        onNotesChanged={load}
        onClose={() => setOpenItem(null)}
      />

      {edit && (
        <EntityEditModal
          kind={edit.kind}
          mode={edit.mode}
          busy={busy}
          accent={edit.kind === "division" ? accentOf(edit.division) : accentOf(edit.division)}
          initial={
            edit.kind === "division"
              ? (edit.division ? { title: edit.division.name, status: edit.division.status, summary: edit.division.summary, accent: edit.division.accent } : undefined)
              : (edit.project ? { title: edit.project.title, status: edit.project.status as Status, detail: edit.project.detail, target_date: edit.project.target_date, belongs_to: edit.division.id } : undefined)
          }
          belongsToOptions={
            edit.kind === "project"
              ? [{ id: edit.division.id, name: edit.division.name, isDivision: true },
                 ...toolsInDivision(edit.division.id).map((t) => ({ id: t.id, name: t.name }))]
              : undefined
          }
          onSave={saveEntity}
          onClose={() => setEdit(null)}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.kind === "division" ? "Delete division?" : "Delete project?"}
        message={
          confirm?.kind === "division"
            ? `Delete "${confirm.division.name}" and everything under it? This can't be undone.`
            : confirm?.kind === "project"
              ? `Delete "${confirm.project.title}"? This can't be undone.`
              : undefined
        }
        confirmLabel="Delete"
        destructive
        busy={busy}
        onConfirm={doDelete}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
