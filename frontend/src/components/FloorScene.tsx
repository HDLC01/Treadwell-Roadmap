import { motion, useReducedMotion } from "framer-motion";
import type { Phase } from "../lib/types";
import { epoxyClass, LAYER_LABELS } from "../lib/format";

// Decorative cross-section of an epoxy floor. Layers stack bottom→top (grind →
// cure). As phases scroll into view (revealedCount grows), each coating "pours"
// up over the bare concrete. Purely visual — aria-hidden; the real content is
// the PhaseRail beside it. Reduced motion → fully built immediately.
export default function FloorScene({
  phases, revealedCount, accent, activeIndex,
}: {
  phases: Phase[];
  revealedCount: number;
  accent: string;
  activeIndex: number;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      aria-hidden="true"
      className="flex h-full w-full flex-col-reverse overflow-hidden rounded-xl border border-border bg-surface"
      style={{ ["--epoxy-base" as string]: accent }}
    >
      {phases.map((p, i) => {
        const built = reduce ? true : i < revealedCount;
        const isActive = i === activeIndex;
        return (
          <div
            key={p.id}
            className="epoxy-concrete relative flex-1 border-t border-black/10"
            style={{ minHeight: 36 }}
          >
            <motion.div
              className={`absolute inset-0 ${epoxyClass(p.status)}`}
              style={{ transformOrigin: "bottom" }}
              initial={{ scaleY: reduce ? 1 : 0 }}
              animate={{ scaleY: built ? 1 : 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            {/* feature flakes on the base coat once built */}
            {built && p.layer_type === "basecoat" && <Flakes phase={p} />}
            <span
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
              style={{ outline: isActive ? "2px solid rgba(255,255,255,.7)" : "none" }}
            >
              {LAYER_LABELS[p.layer_type].split(" ")[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Flakes({ phase }: { phase: Phase }) {
  const feats = phase.items.filter((it) => it.is_feature && it.status === "live").slice(0, 10);
  return (
    <>
      {feats.map((it, idx) => {
        // Deterministic scatter from the item id (stable across renders).
        const seed = it.id.charCodeAt(0) + it.id.charCodeAt(it.id.length - 1) + idx * 37;
        const left = 12 + (seed % 76);
        const top = 25 + ((seed * 7) % 50);
        const rot = (seed % 40) - 20;
        return (
          <span
            key={it.id}
            title={it.title}
            className="absolute h-1.5 w-2.5 rounded-[2px]"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              transform: `rotate(${rot}deg)`,
              background: "linear-gradient(135deg,#e2e8f0,#94a3b8 60%,#cbd5e1)",
              boxShadow: "0 0 0 0.5px rgba(0,0,0,.15)",
            }}
          />
        );
      })}
    </>
  );
}
