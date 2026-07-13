// Domain types mirroring the FastAPI JSON shapes.

export type Status = "live" | "in_progress" | "planned" | "not_started";
export type FloorKind = "overview" | "system" | "division";
export type LayerType =
  | "grind" | "repair" | "clean" | "primer" | "basecoat" | "topcoat" | "cure";
export type DocKind = "sop" | "dev_doc";
export type Role = "admin" | "member" | "viewer";

export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  role: Role;
  status?: string;
  last_login_at?: string | null;
}

export interface SystemSummary {
  id: string;
  slug: string;
  name: string;
  summary?: string | null;
  kind: FloorKind;
  status: Status;
  accent?: string | null;
  live_url?: string | null;
  ordering: number;
  priority?: boolean;
  /** When this tool/division was added (ISO). */
  created_at?: string | null;
  /** True when this tool (or a feature under it) was edited in the last 7 days —
   *  drives the "New Update" badge on the tile. */
  has_update?: boolean;
  /** Unresolved admin flags on this tool itself — >0 shows a red flag on the tile
   *  and floats it to the top of its division. */
  open_notes?: number;
  /** Which division this tool tile is filed under on the home board (drag-to-move).
   *  null = default placement (Sales & Marketing). */
  division_id?: string | null;
  phase_count: number;
  item_count: number;
  live_item_count: number;
  /** Project milestones tagged to this floor as their division (the cross-over).
   *  Non-zero only for Divisions. */
  project_item_count?: number;
  /** In-progress feature cards on this floor — shown as sub-boxes on the overview;
   *  clicking one opens its sub-process drawer. */
  inprogress_projects?: { id: string; title: string; detail?: string | null; status: Status }[];
  /** EVERY feature card on this floor (the division's Kanban board) — revealed by
   *  the "show all sub-projects" button on the overview; carries the author + star. */
  all_projects?: { id: string; title: string; detail?: string | null; status: Status; created_by?: string | null; priority?: boolean; target_date?: string | null; created_at?: string | null; open_notes?: number; version?: string | null }[];
  /** Version timeline for this floor (v1, planned v2 …) — badged on the overview. */
  versions?: { version_num: number; label: string; status: Status }[];
  pos_x?: number | null;
  pos_y?: number | null;
}

export interface RoadmapItem {
  id: string;
  system_id?: string | null;
  phase_id?: string | null;
  division_id?: string | null;
  version_id?: string | null;
  division_name?: string | null;
  division_slug?: string | null;
  division_accent?: string | null;
  title: string;
  detail?: string | null;
  status: Status;
  is_feature: boolean;
  ordering: number;
  priority?: boolean;
  created_by?: string | null;
  target_date?: string | null;
  created_at?: string | null;
  open_notes?: number;
}

// A note on a project or Live tool. Everyone reads the thread. An admin's note is a
// FLAG (is_flag) that turns the project red until resolved; a member's note is a plain
// reply answering back. Only an admin resolves or deletes.
export interface ProjectNote {
  id: string;
  author_email: string;
  body: string;
  resolved: boolean;
  is_flag: boolean;
  created_at: string;
}

// Notification-bell feed item — a team action from the activity log (someone
// else's add / edit / star / move / delete of a project, tool, or division).
export interface RoadmapNotification {
  id: string;
  actor_email: string;
  action: "created" | "updated" | "deleted" | "status_change" | "priority" | string;
  entity_type: string; // feature | roadmap_item | system | division
  entity_id?: string | null;
  detail?: Record<string, unknown> | null;
  title?: string | null;
  created_at?: string | null;
  unread: boolean;
}

export interface Phase {
  id: string;
  layer_type: LayerType;
  title: string;
  phase_label?: string | null;
  detail?: string | null;
  status: Status;
  ordering: number;
  pos_x?: number | null;
  pos_y?: number | null;
  items: RoadmapItem[];
}

export interface DocIndexEntry {
  id: string;
  kind: DocKind;
  section?: string | null;
  slug: string;
  title: string;
  ordering: number;
}

export interface SystemVersion {
  id: string;
  version_num: number;
  label: string;
  status: Status;
  note?: string | null;
  ordering: number;
}

export interface SystemDetail {
  id: string;
  slug: string;
  name: string;
  summary?: string | null;
  kind: FloorKind;
  status: Status;
  accent?: string | null;
  live_url?: string | null;
  ordering: number;
  phases: Phase[];
  docs: DocIndexEntry[];
  /** Per-project feature board — items attached to this system directly. */
  features: RoadmapItem[];
  /** Version timeline (v1, v2, planned v3 …) — features scope to the selected one. */
  versions: SystemVersion[];
}

export interface DocPage {
  id: string;
  system_id: string;
  kind: DocKind;
  section?: string | null;
  slug: string;
  title: string;
  body_markdown: string;
  ordering: number;
  updated_at?: string;
}
