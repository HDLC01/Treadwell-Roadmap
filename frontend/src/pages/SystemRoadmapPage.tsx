import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ReactFlow, Controls, MiniMap, Panel,
  useNodesState, useEdgesState,
  type Node, type Edge, type ReactFlowInstance,
} from "@xyflow/react";
import { AlertCircle, BookOpen, ExternalLink, FileText, Pencil } from "lucide-react";
import * as api from "../lib/api";
import type { RoadmapItem, Status, SystemDetail, SystemSummary } from "../lib/types";
import { useAuth } from "../lib/auth";
import { LANES, laneToStatus, statusToLane, STATUS_LABELS, STATUS_VAR } from "../lib/format";
import { FeatureNode, LaneNode } from "../components/flow/nodes";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { PageSkeleton } from "../components/Skeleton";
import ConfirmDialog from "../components/ConfirmDialog";
import FeatureDetailDrawer from "../components/FeatureDetailDrawer";
import FeatureEditModal from "../components/FeatureEditModal";
import PromptModal from "../components/PromptModal";
import VersionTimeline from "../components/VersionTimeline";

const NODE_TYPES = { feature: FeatureNode, lane: LaneNode };

// Shipped systems hang under this division (mirrors the home page), so the
// division board shows + counts them.
const SALES_SLUG = "sales-marketing";

// Board geometry — 3 lanes side by side; features stacked within each lane.
const LANE_W = 300;     // horizontal spacing between lanes
const NODE_X = 16;      // feature x offset inside its lane
const HEAD_Y = 52;      // first feature y (below the lane header)
const ROW_H = 150;      // vertical gap between features (must exceed the tallest card)
const MIN_LANE_H = 340;

export default function SystemRoadmapPage() {
  const { slug = "" } = useParams();
  const { isAdmin } = useAuth();
  const nav = useNavigate();
  const [allSystems, setAllSystems] = useState<SystemSummary[]>([]);
  const [detail, setDetail] = useState<SystemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirm, setConfirm] = useState<null | {
    title: string; message?: string; confirmLabel?: string; destructive?: boolean; reload?: boolean; run: () => Promise<void>;
  }>(null);
  const [busy, setBusy] = useState(false);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<RoadmapItem | null>(null);
  const [editItem, setEditItem] = useState<RoadmapItem | null>(null);
  const [prompt, setPrompt] = useState<null | { title: string; label: string; placeholder?: string; onSubmit: (v: string) => void }>(null);
  const [editHeader, setEditHeader] = useState(false);
  const [hdrName, setHdrName] = useState("");
  const [hdrSummary, setHdrSummary] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, , onEdgesChange] = useEdgesState<Edge>([]);
  const rf = useRef<ReactFlowInstance | null>(null);

  const load = useCallback(() => {
    api.getSystem(slug)
      .then((d) => { setDetail(d); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);
  useEffect(() => { load(); }, [load]);

  // Default to the active version (highest version_num that's live/in_progress,
  // else the highest overall); keep the current pick if it's still valid.
  useEffect(() => {
    const vs = detail?.versions ?? [];
    if (!vs.length) { setVersionId(null); return; }
    const byNum = [...vs].sort((a, b) => b.version_num - a.version_num);
    const active = byNum.find((v) => v.status === "live" || v.status === "in_progress") ?? byNum[0];
    setVersionId((cur) => (cur && vs.some((v) => v.id === cur)) ? cur : active.id);
  }, [detail]);

  const ask = (
    title: string,
    fn: () => Promise<unknown>,
    opts: { message?: string; confirmLabel?: string; destructive?: boolean; reload?: boolean } = {},
  ) => setConfirm({ title, run: async () => { await fn(); }, ...opts });

  // Confirm before committing an edit ("are you sure you want to save?").
  const confirmSave = (proceed: () => void) =>
    ask("Are you sure you want to save these changes?", async () => { proceed(); },
      { confirmLabel: "Save", destructive: false, reload: false });

  const accent = detail?.accent || "#475569";

  // ── feature CRUD handlers (closures rebuilt with the node board) ──
  const addFeature = (laneKey: string) => {
    if (!detail) return;
    setPrompt({
      title: "Add a feature",
      label: "Feature name",
      placeholder: "e.g. Instant lead auto-response",
      // Land the new feature in the currently-selected version so it shows on the board.
      onSubmit: (t) => {
        api.createFeature(detail.id, {
          title: t,
          status: laneToStatus[laneKey as keyof typeof laneToStatus],
          version_id: versionId,
        }).then(load);
      },
    });
  };
  const saveFeature = (id: string, patch: { title?: string; detail?: string | null }) => {
    api.updateItem(id, patch).then(load);
  };
  const deleteFeature = (it: RoadmapItem) =>
    ask(`Delete feature "${it.title}"?`, () => api.deleteItem(it.id), { destructive: true, confirmLabel: "Delete" });

  const addVersion = () => {
    if (!detail) return;
    setPrompt({
      title: "Add a version",
      label: "Version label",
      placeholder: 'e.g. "v3" or "Planned v3"',
      onSubmit: (label) => {
        api.createVersion(detail.id, { label, status: "planned" })
          .then((r) => { setVersionId(r.id); load(); });
      },
    });
  };
  // Edit gate already passed (via VersionTimeline → requestEdit) before the inline
  // editor opened, so saving here just persists.
  const saveVersion = (id: string, patch: { label?: string; status?: string; note?: string | null }) =>
    api.updateVersion(id, patch).then(load);
  const deleteVersion = (v: { id: string; label: string }) =>
    ask(`Delete ${v.label}? Its features move to the lowest remaining version.`,
      () => api.deleteVersion(v.id), { destructive: true, confirmLabel: "Delete" });

  // Editable floor title + summary (no longer hard-coded in the seed).
  const startHeaderEdit = () => { setHdrName(detail?.name ?? ""); setHdrSummary(detail?.summary ?? ""); setEditHeader(true); };
  const saveHeader = () => {
    if (!detail) return;
    confirmSave(() => {
      api.updateSystem(detail.id, { name: hdrName.trim() || detail.name, summary: hdrSummary.trim() || null })
        .then(() => { setEditHeader(false); load(); });
    });
  };

  // Shipped systems that belong to this division (mirrors the home page) — so the
  // board shows + counts them. Only sales-marketing currently hangs systems.
  useEffect(() => { api.getSystems().then((r) => setAllSystems(r.systems)).catch(() => {}); }, []);
  const childSystems = useMemo(
    () => (slug === SALES_SLUG ? allSystems.filter((s) => s.kind === "system") : []),
    [allSystems, slug],
  );
  const sysById = useMemo(() => new Map(childSystems.map((s) => [s.id, s] as const)), [childSystems]);
  const sysIds = useMemo(() => new Set(childSystems.map((s) => s.id)), [childSystems]);

  const builtNodes = useMemo(() => {
    const feats = (detail?.features ?? [])
      .filter((f) => f.is_feature && (versionId ? f.version_id === versionId : true));
    // Shipped systems render as read-only Live cards (no edit/delete/drag).
    const systemItems: RoadmapItem[] = childSystems.map((s) => ({
      id: s.id, title: s.name, status: s.status, is_feature: true, ordering: -1, detail: s.summary ?? null,
    } as RoadmapItem));
    const byLane: Record<string, RoadmapItem[]> = { live: [], in_progress: [], not_started: [] };
    systemItems.forEach((s) => byLane[statusToLane(s.status)].push(s));
    feats.forEach((f) => byLane[statusToLane(f.status)].push(f));
    const maxCount = Math.max(0, ...LANES.map((l) => byLane[l.key].length));
    const laneH = Math.max(MIN_LANE_H, HEAD_Y + maxCount * ROW_H + 16);

    const laneNodes: Node[] = LANES.map((l, i) => ({
      id: `lane-${l.key}`, type: "lane",
      position: { x: i * LANE_W, y: 0 },
      data: { label: l.label, count: byLane[l.key].length, height: laneH, laneKey: l.key, color: STATUS_VAR[laneToStatus[l.key]], edit: isAdmin, onAdd: addFeature },
      draggable: false, selectable: false, zIndex: 0,
    }));
    const featNodes: Node[] = [];
    LANES.forEach((l, i) => {
      byLane[l.key].forEach((f, j) => {
        const isSys = sysIds.has(f.id);
        featNodes.push({
          id: f.id, type: "feature",
          position: { x: i * LANE_W + NODE_X, y: HEAD_Y + j * ROW_H },
          data: isSys
            ? { item: f, accent, edit: false, system: true, onDelete: () => {},
                onOpen: () => { const sys = sysById.get(f.id); if (sys) nav(`/floor/${sys.slug}`); } }
            : { item: f, accent, edit: isAdmin, onDelete: deleteFeature, onOpen: setOpenItem, onEdit: setEditItem },
          draggable: isAdmin && !isSys, zIndex: 1,
        });
      });
    });
    return [...laneNodes, ...featNodes];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, accent, isAdmin, versionId, childSystems, sysIds, sysById, nav]);

  useEffect(() => {
    setNodes(builtNodes);
    if (builtNodes.length) {
      const t = setTimeout(() => rf.current?.fitView({ padding: 0.12 }), 60);
      return () => clearTimeout(t);
    }
  }, [builtNodes, setNodes]);

  // Kanban drag: dropping a card sets its lane (status) by X and its position
  // within the lane by Y. We rebuild the lane order and persist both the status
  // (if the lane changed) and the new card ordering, so it no longer snaps back.
  const onNodeDragStop = useCallback(async (_e: unknown, node: { id: string; type?: string; position: { x: number; y: number } }) => {
    if (!isAdmin || node.type !== "feature" || !detail) return;
    if (sysIds.has(node.id)) return;  // shipped-system cards are read-only
    const laneIdx = Math.max(0, Math.min(LANES.length - 1, Math.round(node.position.x / LANE_W)));
    const targetLane = LANES[laneIdx].key;
    const dropPos = Math.max(0, Math.round((node.position.y - HEAD_Y) / ROW_H));

    // Rebuild the per-lane lists for the current version (same binning as the board),
    // with the dragged card removed, then insert it at the drop position.
    const feats = (detail.features ?? []).filter((f) => f.is_feature && (versionId ? f.version_id === versionId : true));
    const dragged = feats.find((f) => f.id === node.id);
    if (!dragged) { load(); return; }
    const lanes: Record<string, RoadmapItem[]> = { live: [], in_progress: [], not_started: [] };
    feats.forEach((f) => { if (f.id !== node.id) lanes[statusToLane(f.status)].push(f); });
    lanes[targetLane].splice(Math.min(dropPos, lanes[targetLane].length), 0, dragged);

    const orderedIds = LANES.flatMap((l) => lanes[l.key].map((f) => f.id));
    const statusChanged = statusToLane(dragged.status) !== targetLane;
    try {
      if (statusChanged) await api.setItemStatus(node.id, laneToStatus[targetLane] as Status);
      await api.reorderFeatures(detail.id, orderedIds);
    } finally {
      load();
    }
  }, [isAdmin, detail, versionId, load, sysIds]);

  if (loading) return <div className="p-6"><PageSkeleton /></div>;
  if (error || !detail) return <div className="p-6"><EmptyState title="Floor not found" message="This roadmap may have been removed, or you're not signed in." icon={AlertCircle} /></div>;

  const featureCount = (detail.features ?? [])
    .filter((f) => f.is_feature && (versionId ? f.version_id === versionId : true)).length + childSystems.length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-2.5 pb-2">
        {editHeader ? (
          <div className="flex-1">
            <input
              autoFocus value={hdrName} onChange={(e) => setHdrName(e.target.value)} placeholder="Title"
              className="w-full max-w-lg rounded border border-border bg-bg px-2 py-1 text-xl font-extrabold text-fg"
            />
            <textarea
              value={hdrSummary} onChange={(e) => setHdrSummary(e.target.value)} rows={2} placeholder="Summary (optional)"
              className="mt-1.5 w-full max-w-2xl resize-none rounded border border-border bg-bg px-2 py-1 text-sm text-fg"
            />
            <div className="mt-1.5 flex gap-1">
              <button onClick={() => setEditHeader(false)} className="rounded border border-border px-2 py-1 text-xs text-fg hover:bg-surface-2">Cancel</button>
              <button onClick={saveHeader} className="rounded bg-accent px-2 py-1 text-xs font-semibold text-white">Save</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ background: accent }} />
              <h1
                className={`text-lg font-extrabold leading-tight tracking-tight text-fg sm:text-xl ${isAdmin ? "cursor-text" : ""}`}
                onDoubleClick={() => { if (isAdmin) startHeaderEdit(); }}
                title={isAdmin ? "Double-click to edit the title & summary" : undefined}
              >{detail.name}</h1>
              <StatusBadge status={detail.status} />
              {detail.live_url && (
                <a
                  href={detail.live_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[11px] font-semibold text-accent hover:bg-surface-2"
                  title={`Open ${detail.name} (live site)`}
                >
                  <ExternalLink className="h-3 w-3" /> Visit live site
                </a>
              )}
              {isAdmin && (
                <button onClick={startHeaderEdit} aria-label="Edit title & summary" title="Edit title & summary" className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted hover:bg-surface-2 hover:text-fg">
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              )}
            </div>
            {detail.summary && (
              <p
                className={`mt-0.5 line-clamp-1 max-w-3xl text-xs text-muted ${isAdmin ? "cursor-text" : ""}`}
                onDoubleClick={() => { if (isAdmin) startHeaderEdit(); }}
                title={isAdmin ? detail.summary : undefined}
              >{detail.summary}</p>
            )}
          </div>
        )}
      </div>

      <VersionTimeline
        versions={detail.versions ?? []}
        selectedId={versionId}
        onSelect={setVersionId}
        editable={isAdmin}
        onAdd={addVersion}
        onSave={saveVersion}
        onRequestSave={confirmSave}
        onDelete={deleteVersion}
      />

      {featureCount === 0 && !isAdmin ? (
        <div className="p-6"><EmptyState title="No features yet" message="This roadmap is being prepared." /></div>
      ) : (
        <div className="min-h-0 flex-1 border-t border-border bg-surface-2">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={onNodeDragStop}
            onInit={(inst) => { rf.current = inst; }}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.1, maxZoom: 1 }}
            minZoom={0.5}
            proOptions={{ hideAttribution: true }}
            nodesConnectable={false}
            nodesDraggable={isAdmin}
            nodeDragThreshold={6}
          >
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeColor={accent} />
            {/* SOP + Documentation legend + status key */}
            <Panel position="top-right">
              <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface/95 p-2.5 text-xs shadow-sm backdrop-blur">
                <div className="flex gap-1.5">
                  <Link to={`/floor/${slug}/sop`} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 font-medium text-fg hover:bg-surface-2">
                    <FileText className="h-3.5 w-3.5" /> SOP
                  </Link>
                  <Link to={`/floor/${slug}/docs`} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 font-medium text-fg hover:bg-surface-2">
                    <BookOpen className="h-3.5 w-3.5" /> Documentation
                  </Link>
                </div>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-border pt-1.5 text-[10px] text-muted">
                  {(["live", "in_progress", "planned", "not_started"] as const).map((s) => (
                    <span key={s} className="inline-flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: STATUS_VAR[s] }} />
                      {STATUS_LABELS[s]}
                    </span>
                  ))}
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title || ""}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel || "Confirm"}
        destructive={confirm?.destructive}
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;
          setBusy(true);
          try { await confirm.run(); if (confirm.reload !== false) load(); }
          finally { setBusy(false); setConfirm(null); }
        }}
      />

      <FeatureEditModal
        item={editItem}
        accent={accent}
        onSave={(id, patch) => confirmSave(() => { saveFeature(id, patch); setEditItem(null); })}
        onClose={() => setEditItem(null)}
      />

      <FeatureDetailDrawer item={openItem} accent={accent} onClose={() => setOpenItem(null)} />

      <PromptModal
        open={!!prompt}
        title={prompt?.title || ""}
        label={prompt?.label || ""}
        placeholder={prompt?.placeholder}
        onSubmit={(v) => prompt?.onSubmit(v)}
        onClose={() => setPrompt(null)}
      />
    </div>
  );
}
