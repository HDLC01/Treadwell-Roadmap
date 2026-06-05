import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ReactFlow, Background, BackgroundVariant, Controls, MiniMap, Panel,
  useNodesState, useEdgesState, Position, MarkerType,
  type Node, type Edge, type ReactFlowInstance, type NodeMouseHandler,
} from "@xyflow/react";
import { AlertCircle, Plus } from "lucide-react";
import * as api from "../lib/api";
import type { Phase, RoadmapItem, Status, SystemDetail, SystemSummary } from "../lib/types";
import { useAuth } from "../lib/auth";
import { LAYER_LABELS } from "../lib/format";
import { PhaseNode } from "../components/flow/nodes";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import { PageSkeleton } from "../components/Skeleton";
import ConfirmDialog from "../components/ConfirmDialog";
import PhaseDetailDrawer from "../components/PhaseDetailDrawer";

const NODE_TYPES = { phase: PhaseNode };
const LAYER_OPTS: Phase["layer_type"][] = ["grind", "repair", "clean", "primer", "basecoat", "topcoat", "cure"];

export default function SystemRoadmapPage() {
  const { slug = "" } = useParams();
  const { isAdmin } = useAuth();
  const [detail, setDetail] = useState<SystemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [edit, setEdit] = useState(false);
  const [divisions, setDivisions] = useState<SystemSummary[]>([]);
  const [confirm, setConfirm] = useState<null | { title: string; run: () => Promise<void> }>(null);
  const [busy, setBusy] = useState(false);
  const [newLayer, setNewLayer] = useState<Phase["layer_type"]>("primer");
  const [newPhaseTitle, setNewPhaseTitle] = useState("");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const rf = useRef<ReactFlowInstance | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(() => {
    api.getSystem(slug)
      .then((d) => { setDetail(d); setError(false); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (edit && divisions.length === 0) api.getSystems("division").then((r) => setDivisions(r.systems)).catch(() => {});
  }, [edit, divisions.length]);

  const refetch = useCallback(() => { load(); }, [load]);
  const ask = (title: string, fn: () => Promise<unknown>) =>
    setConfirm({ title, run: async () => { await fn(); load(); } });

  const accent = detail?.accent || "#475569";
  // Click a phase node (view mode) → open the detail panel with its points.
  const onNodeClick: NodeMouseHandler = useCallback((_e, node) => {
    if (edit) return;
    setSelectedId(node.id);
  }, [edit]);
  const selectedPhase = (detail?.phases ?? []).find((p) => p.id === selectedId) ?? null;
  // Persist a dragged layout (admins only — positions are shared/canonical).
  const onNodeDragStop = useCallback((_e: unknown, node: { id: string; position: { x: number; y: number } }) => {
    if (!isAdmin) return;
    api.updatePhase(node.id, { pos_x: Math.round(node.position.x), pos_y: Math.round(node.position.y) }).catch(() => {});
  }, [isAdmin]);

  const { builtNodes, builtEdges } = useMemo(() => {
    const phases = detail?.phases ?? [];
    const n: Node[] = [];
    const e: Edge[] = [];
    phases.forEach((p, i) => {
      n.push({
        id: p.id, type: "phase",
        position: { x: p.pos_x ?? i * 340, y: p.pos_y ?? (i % 2) * 80 },
        targetPosition: Position.Left, sourcePosition: Position.Right,
        data: {
          phase: p, accent, edit, divisions,
          onPhaseStatus: (id: string, next: Status) => { api.updatePhase(id, { status: next }).then(refetch); },
          onPhaseDelete: (ph: Phase) => ask(`Delete phase "${ph.phase_label || ph.title}" and its tasks?`, () => api.deletePhase(ph.id)),
          onAddItem: (phaseId: string, title: string) => { api.createItem(phaseId, { title }).then(refetch); },
          onItemStatus: (id: string, next: Status) => { api.setItemStatus(id, next).then(refetch); },
          onItemDivision: (id: string, divId: string) => { api.updateItem(id, { division_id: divId || null }).then(refetch); },
          onItemFeature: (id: string, val: boolean) => { api.updateItem(id, { is_feature: val }).then(refetch); },
          onItemDelete: (it: RoadmapItem) => ask(`Delete task "${it.title}"?`, () => api.deleteItem(it.id)),
        },
        draggable: true,
      });
      if (i > 0) {
        const prev = phases[i - 1];
        e.push({
          id: `${prev.id}-${p.id}`, source: prev.id, target: p.id, type: "smoothstep",
          animated: p.status === "in_progress" || p.status === "live",
          style: { stroke: accent, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: accent },
        });
      }
    });
    return { builtNodes: n, builtEdges: e };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, edit, divisions, accent]);

  useEffect(() => {
    setNodes(builtNodes);
    setEdges(builtEdges);
    if (builtNodes.length) {
      const t = setTimeout(() => rf.current?.fitView({ padding: 0.15 }), 60);
      return () => clearTimeout(t);
    }
  }, [builtNodes, builtEdges, setNodes, setEdges]);

  const addPhase = () => {
    if (!detail) return;
    const t = newPhaseTitle.trim();
    if (!t) return;
    api.createPhase(detail.id, { layer_type: newLayer, title: t, phase_label: t }).then(() => { setNewPhaseTitle(""); load(); });
  };

  if (loading) return <div className="p-6"><PageSkeleton /></div>;
  if (error || !detail) return <div className="p-6"><EmptyState title="Floor not found" message="This roadmap may have been removed, or you're not signed in." icon={AlertCircle} /></div>;

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

      {detail.phases.length === 0 && !edit ? (
        <div className="p-6"><EmptyState title="No phases yet" message={isAdmin ? "Turn on Edit mode to add the first phase." : "This roadmap is being prepared."} /></div>
      ) : (
        <div className="min-h-0 flex-1 border-t border-border bg-surface-2">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDragStop={onNodeDragStop}
            onInit={(inst) => { rf.current = inst; }}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.1 }}
            minZoom={0.2}
            proOptions={{ hideAttribution: true }}
            nodesConnectable={false}
            nodesDraggable={isAdmin}
          >
            <Background variant={BackgroundVariant.Dots} gap={18} size={1.5} />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeColor={accent} />
            {edit && (
              <Panel position="top-left">
                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface/95 p-2 shadow-sm backdrop-blur">
                  <select value={newLayer} onChange={(e) => setNewLayer(e.target.value as Phase["layer_type"])} className="rounded border border-border bg-bg px-1.5 py-1 text-xs text-fg">
                    {LAYER_OPTS.map((l) => <option key={l} value={l}>{LAYER_LABELS[l]}</option>)}
                  </select>
                  <input value={newPhaseTitle} onChange={(e) => setNewPhaseTitle(e.target.value)} placeholder="New phase…" className="w-32 rounded border border-border bg-bg px-2 py-1 text-xs text-fg" />
                  <button onClick={addPhase} className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-xs font-semibold text-accent-fg"><Plus className="h-3.5 w-3.5" /> Phase</button>
                </div>
              </Panel>
            )}
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
      <PhaseDetailDrawer phase={selectedPhase} accent={accent} onClose={() => setSelectedId(null)} />
    </div>
  );
}
