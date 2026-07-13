import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";

export type MenuItem = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  danger?: boolean;
};

// A right-click context menu for the board. Rendered in a portal at document.body
// so the scrolling board never clips it; positioned at the cursor and nudged back
// inside the viewport. Closes on outside mousedown / Escape / scroll / resize.
export default function BoardContextMenu({
  x, y, items, onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  // Nudge the menu so it stays fully on-screen (measure after it mounts).
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const pad = 8;
    const nx = Math.min(x, window.innerWidth - width - pad);
    const ny = Math.min(y, window.innerHeight - height - pad);
    setPos({ x: Math.max(pad, nx), y: Math.max(pad, ny) });
  }, [x, y]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKey);
    // capture so a scroll on any ancestor (the board list) also dismisses it
    window.addEventListener("mousedown", onDown, true);
    window.addEventListener("scroll", onClose, true);
    window.addEventListener("resize", onClose);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown, true);
      window.removeEventListener("scroll", onClose, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-[1100] min-w-[11rem] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-2xl"
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <button
            key={it.label}
            type="button"
            role="menuitem"
            onClick={() => { onClose(); it.onClick(); }}
            className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition ${
              it.danger
                ? "text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                : "text-fg hover:bg-surface-2"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-80" />
            {it.label}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
