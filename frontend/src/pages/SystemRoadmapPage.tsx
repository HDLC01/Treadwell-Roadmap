import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ReactFlow, Controls, MiniMap, Panel,
  useNodesState, useEdgesState,
  type Node, type Edge, type ReactFlowInstance,
} from "@xyflow/react";
import { AlertCircle, BookOpen, ExternalLink, FileText } from "lucide-react";
import * as api from "../lib/api";
import type { RoadmapItem, Status, SystemDetail } from "../lib/types";
import { useAuth } from "../lib/auth";
import { LANES, laneToStatus, statusToLane, STATUS_LABELS, STATUS_VAR } from "../lib/format";
import { FeatureNode, LaneNode } from "../components/flow/nodes";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { PageSkeleton } from "../components/Skeleton";
import ConfirmDialog from "../components/ConfirmDialog";
import FeatureDetailDrawer from "../components/FeatureDetailDrawer";
import VersionTimeline from "../components/VersionTimeline";

const NODE_TYPES = { feature: FeatureNode, lane: LaneNode };

// Board geometry — 3 lanes side by side; features stacked within each lane.
const LANE_W = 300;     // horizontal spacing between lanes
const NODE_X = 16;      // feature x offset inside its lane
const HEAD_Y = 56;      // first feature y (below the lane header)
const ROW_H = 100;      // vertical gap between features
const MIN_LANE_H = 360;

export default function SystemRoadmapPage() {
  const { slug = "" } = useParams();
  const { isAdmin } = useAuth();
  const [detail, setDetail] = useState<SystemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState<null | { title: string; run: () => Promise<void> }>(null);
  const [busy, setBusy] = useState(false);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<RoadmapItem | null>(null);
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

  const ask = (title: string, fn: () => Promise<unknown>) =>
    setConfirm({ title, run: async () => { await fn(); load(); } });

  const accent = detail?.accent || "#475569";

  // ── feature CRUD handlers (closures rebuilt with the node board) ──
  const addFeature = (laneKey: string) => {
    if (!detail) return;
    const t = window.prompt("New feature name:");
    if (!t?.trim()) return;
    // Land the new feature in the currently-selected version so it shows on the board.
    api.createFeature(detail.id, {
      title: t.trim(),
      status: laneToStatus[laneKey as keyof typeof laneToStatus],
      version_id: versionId,
    }).then(load);
  };
  const saveFeature = (id: string, patch: { title?: string; detail?: string | null }) => {
    api.updateItem(id, patch).then(load);
  };
  const deleteFeature = (it: RoadmapItem) => ask(`Delete feature "${it.title}"?`, () => api.deleteItem(it.id));

  const addVersion = () => {
    if (!detail) return;
    const label = window.prompt("New version label (e.g. \"v3\" or \"Planned v3\"):");
    if (!label?.trim()) return;
    api.createVersion(detail.id, { label: label.trim(), status: "planned" })
      .then((r) => { setVersionId(r.id); load(); });
  };

  const builtNodes = useMemo(() => {
    const feats = (detail?.features ?? [])
      .filter((f) => f.is_feature && (versionId ? f.version_id === versionId : true));
    const byLane: Record<string, RoadmapItem[]> = { live: [], in_progress: [], not_started: [] };
    feats.forEach((f) => byLane[statusToLane(f.status)].push(f));
    const maxCount = Math.max(0, ...LANES.map((l) => byLane[l.key].length));
    const laneH = Math.max(MIN_LANE_H, HEAD_Y + maxCount * ROW_H + 16);

    const laneNodes: Node[] = LANES.map((l, i) => ({
      id: `lane-${l.key}`, type: "lane",
      position: { x: i * LANE_W, y: 0 },
      data: { label: l.label, count: byLane[l.key].length, height: laneH, laneKey: l.key, color: STATUS_VAR[laneToStatus[l.key]], edit, onAdd: addFeature },
      draggable: false, selectable: false, zIndex: 0,
    }));
    const featNodes: Node[] = [];
    LANES.forEach((l, i) => {
      byLane[l.key].forEach((f, j) => {
        featNodes.push({
          id: f.id, type: "feature",
          position: { x: i * LANE_W + NODE_X, y: HEAD_Y + j * ROW_H },
          data: { item: f, accent, edit, onSave: saveFeature, onDelete: deleteFeature, onOpen: setOpenItem },
          draggable: isAdmin, zIndex: 1,
        });
      });
    });
    return [...laneNodes, ...featNodes];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, edit, accent, isAdmin, versionId]);

  useEffect(() => {
    setNodes(builtNodes);
    if (builtNodes.length) {
      const t = setTimeout(() => rf.current?.fitView({ padding: 0.12 }), 60);
      return () => clearTimeout(t);
    }
  }, [builtNodes, setNodes]);

  // Drag a feature into another lane → change its status (persisted).
  const onNodeDragStop = useCallback((_e: unknown, node: { id: string; type?: string; position: { x: number; y: number } }) => {
    if (!isAdmin || node.type !== "feature") return;
    const idx = Math.max(0, Math.min(LANES.length - 1, Math.round(node.position.x / LANE_W)));
    const cur = detail?.features.find((f) => f.id === node.id);
    if (cur && statusToLane(cur.status) !== LANES[idx].key) {
      api.setItemStatus(node.id, laneToStatus[LANES[idx].key] as Status).then(load);
    } else {
      load(); // snap back into the lane grid
    }
  }, [isAdmin, detail, load]);

  if (loading) return <div className="p-6"><PageSkeleton /></div>;
  if (error || !detail) return <div className="p-6"><EmptyState title="Floor not found" message="This roadmap may have been removed, or you're not signed in." icon={AlertCircle} /></div>;

  const featureCount = (detail.features ?? [])
    .filter((f) => f.is_feature && (versionId ? f.version_id === versionId : true)).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: accent }} />
            <h1 className="text-2xl font-extrabold tracking-tight text-fg">{detail.name}</h1>
            <StatusBadge status={detail.status} />
          </div>
          {detail.summary && <p className="mt-1 max-w-2xl text-sm text-muted">{detail.summary}</p>}
        </div>
        {isAdmin && (
          <button onClick={() => setEdit((v) => !v)} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-fg hover:bg-surface-2">
            {edit ? "Done editing" : "Edit mode"}
          </button>
        )}
      </div>

      <VersionTimeline
        versions={detail.versions ?? []}
        selectedId={versionId}
        onSelect={setVersionId}
        isAdmin={isAdmin && edit}
        onAdd={addVersion}
      />

      {featureCount === 0 && !edit ? (
        <div className="p-6"><EmptyState title="No features yet" message={isAdmin ? "Turn on Edit mode and use “+ Add” in a lane." : "This roadmap is being prepared."} /></div>
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
            fitViewOptions={{ padding: 0.12 }}
            minZoom={0.3}
            proOptions={{ hideAttribution: true }}
            nodesConnectable={false}
            nodesDraggable={isAdmin}
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
                  {detail.live_url && (
                    <a
                      href={detail.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 font-medium text-accent hover:bg-surface-2"
                      title={`Open ${detail.name} (live site)`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Visit live site
                    </a>
                  )}
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
        confirmLabel="Delete"
        destructive
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => { if (!confirm) return; setBusy(true); await confirm.run().finally(() => { setBusy(false); setConfirm(null); }); }}
      />

      <FeatureDetailDrawer item={openItem} accent={accent} onClose={() => setOpenItem(null)} />
    </div>
  );
}
