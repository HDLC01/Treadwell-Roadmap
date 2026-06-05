import { Check, CircleDot, Circle, MinusCircle } from "lucide-react";
import type { Status } from "../lib/types";
import { STATUS_LABELS, STATUS_VAR } from "../lib/format";

const ICON = {
  live: Check,
  in_progress: CircleDot,
  planned: Circle,
  not_started: MinusCircle,
} as const;

// Status pill — color + icon + text (never color alone).
export default function StatusBadge({ status, size = "sm" }: { status: Status; size?: "sm" | "xs" }) {
  const Icon = ICON[status];
  const color = STATUS_VAR[status];
  const pad = size === "xs" ? "px-1.5 py-0.5 text-[11px]" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold ${pad}`}
      style={{ color, borderColor: color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      <Icon className={size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
