import type { LayerType, Status } from "./types";

export const STATUS_LABELS: Record<Status, string> = {
  live: "Live",
  in_progress: "In Progress",
  planned: "Planned",
  not_started: "Not Started",
};

// CSS var name per status (used for badges + epoxy finish).
export const STATUS_VAR: Record<Status, string> = {
  live: "var(--live)",
  in_progress: "var(--progress)",
  planned: "var(--planned)",
  not_started: "var(--notstarted)",
};

// Feature board: the three status lanes. `planned` folds into "Not Yet Started".
export type LaneKey = "live" | "in_progress" | "not_started";
export const LANES: { key: LaneKey; label: string }[] = [
  { key: "live", label: "Live" },
  { key: "in_progress", label: "In Progress" },
  { key: "not_started", label: "Not Yet Started" },
];
export function statusToLane(s: Status): LaneKey {
  if (s === "live") return "live";
  if (s === "in_progress") return "in_progress";
  return "not_started"; // planned + not_started both live here
}
export const laneToStatus: Record<LaneKey, Status> = {
  live: "live",
  in_progress: "in_progress",
  not_started: "not_started",
};

export const LAYER_LABELS: Record<LayerType, string> = {
  grind: "Grind / Surface Prep",
  repair: "Crack & Joint Repair",
  clean: "Clean & Vacuum",
  primer: "Primer",
  basecoat: "Base Coat + Flakes",
  topcoat: "Topcoat / Seal",
  cure: "Cure",
};

// Maps a status to its epoxy finish utility class.
export function epoxyClass(status: Status): string {
  switch (status) {
    case "live": return "epoxy-gloss";
    case "in_progress": return "epoxy-wet animate-pour-sheen";
    case "planned": return "epoxy-primer";
    default: return "epoxy-concrete";
  }
}

// "added by" author, made human. Emails become the capitalized local part
// (hanz@wetreadwell.com -> "Hanz", jane.doe@… -> "Jane Doe"); the seed's
// ideas-doc label is shortened; a plain name (e.g. "Will") passes through.
export function formatAuthor(createdBy?: string | null): string {
  const raw = (createdBy || "").trim();
  if (!raw) return "";
  if (raw === "AI Treadwell Ideas doc") return "Ideas doc";
  if (raw.includes("@")) {
    const local = raw.split("@")[0];
    return local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
  }
  return raw;
}

// Target date "YYYY-MM-DD" -> short "Jul 15" (parsed as local so it never shifts
// a day across time zones). Returns "" when unset.
export function targetDateLabel(date?: string | null): string {
  if (!date) return "";
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return "";
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function relativeDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
