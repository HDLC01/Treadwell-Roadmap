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

export function relativeDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
