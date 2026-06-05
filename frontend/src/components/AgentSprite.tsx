import { useEffect, useRef } from "react";

// ARIA-style "agent working" sprite — procedurally drawn on a 2D canvas.
// Each agent ACTS OUT its phase: Discovery inspects with a magnifier, Repair
// wrenches, Clean sweeps, Primer/Base rolls paint, Topcoat squeegees, Cure is
// done (✓), and project/hub nodes manage on a tablet. Respects reduced-motion.
export type Activity =
  | "grind" | "repair" | "clean" | "primer" | "basecoat" | "topcoat" | "cure" | "manage";

interface Props {
  color: string;
  activity?: Activity;
  working?: boolean;
  size?: number;
  statusColor?: string;
}

const SKIN = "#fdd9b5";
const METAL = "#cbd5e1";
const METAL_DK = "#94a3b8";
const WOOD = "#b08968";

function arm(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath(); // hand
  ctx.arc(x2, y2, 1.7, 0, Math.PI * 2);
  ctx.fillStyle = SKIN;
  ctx.fill();
}

export function drawAgent(
  ctx: CanvasRenderingContext2D, cx: number, footY: number,
  color: string, t: number, working: boolean, statusColor: string, activity: Activity,
) {
  const speed = working ? 1 : 0.45;
  const bobY = working ? Math.sin(t * 3) * 1.6 : Math.sin(t * 1.3) * 0.7;
  const y = footY + bobY;
  const headY = y - 18;

  // working aura
  if (working) {
    const pulse = 0.16 + Math.sin(t * 2.5) * 0.09;
    ctx.beginPath();
    ctx.arc(cx, y - 9, 17, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(59,130,246,${pulse})`;
    ctx.fill();
  }
  // shadow
  ctx.beginPath();
  ctx.ellipse(cx, footY + 11, 9, 3.4, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.10)";
  ctx.fill();
  // legs
  ctx.fillStyle = "#5b6472";
  ctx.fillRect(cx - 3.5, y, 2.5, 6);
  ctx.fillRect(cx + 1, y, 2.5, 6);
  // body
  ctx.fillStyle = color;
  ctx.fillRect(cx - 5.5, y - 11, 11, 12);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(cx - 4.5, y - 10, 3.5, 10);

  const sh = { x: cx + 5, y: y - 9 }; // right shoulder
  const lsh = { x: cx - 5, y: y - 9 };

  // ── per-activity arms + tool ──
  switch (activity) {
    case "grind": { // Discovery — inspect with a magnifying glass
      const sweep = Math.sin(t * 2 * speed) * 3;
      const hx = cx + 11 + sweep, hy = y - 6;
      arm(ctx, lsh.x, lsh.y, cx - 7, y - 2, color); // left at side
      arm(ctx, sh.x, sh.y, hx - 3, hy, color);
      ctx.strokeStyle = METAL_DK; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(hx - 3, hy); ctx.lineTo(hx, hy + 2); ctx.stroke(); // handle
      ctx.beginPath(); ctx.arc(hx + 2, hy - 2, 4.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(147,197,253,0.30)"; ctx.fill();
      ctx.strokeStyle = METAL_DK; ctx.lineWidth = 1.6; ctx.stroke();
      bubble(ctx, cx + 1, headY - 12, "?", working, t);
      break;
    }
    case "repair": { // wrench / turning
      const swing = Math.sin(t * 7 * speed) * 4;
      const hx = cx + 9, hy = y - 11 + swing;
      arm(ctx, lsh.x, lsh.y, cx - 7, y - 2, color);
      arm(ctx, sh.x, sh.y, hx, hy, color);
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(-0.6 + swing * 0.05);
      ctx.fillStyle = METAL; ctx.fillRect(-1, -1, 3, 9); // handle
      ctx.fillStyle = METAL_DK; ctx.fillRect(-3, -3, 7, 3); // head
      ctx.clearRect(0, -3, 2, 3);
      ctx.restore();
      break;
    }
    case "clean": { // sweeping a broom
      const sweep = Math.sin(t * 3.2 * speed) * 4;
      const bx = cx + 9 + sweep, by = y + 5;
      arm(ctx, lsh.x, lsh.y, cx + 1, y - 4, color);
      arm(ctx, sh.x, sh.y, cx + 6, y - 6, color);
      ctx.strokeStyle = WOOD; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx + 4, y - 8); ctx.lineTo(bx, by); ctx.stroke();
      ctx.fillStyle = "#d4a373"; ctx.fillRect(bx - 3, by, 6, 4); // bristles
      for (let i = 0; i < 3; i++) { // dust
        ctx.beginPath();
        ctx.arc(bx + 4 + i * 2 + Math.sin(t * 4 + i) * 1.5, by + 2, 0.7, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(120,120,120,0.5)"; ctx.fill();
      }
      break;
    }
    case "primer":
    case "basecoat": { // rolling paint up a wall
      const ry = Math.sin(t * 4 * speed) * 5;
      const hx = cx + 10, hy = y - 13 + ry;
      arm(ctx, lsh.x, lsh.y, cx - 7, y - 2, color);
      arm(ctx, sh.x, sh.y, hx - 2, hy + 3, color);
      ctx.strokeStyle = METAL_DK; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(hx - 2, hy + 3); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillRect(hx - 1, hy - 4, 7, 4); // roller
      ctx.strokeStyle = `${color}`; ctx.globalAlpha = 0.25; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(hx + 2, y - 16); ctx.lineTo(hx + 2, y - 2); ctx.stroke();
      ctx.globalAlpha = 1;
      if (activity === "basecoat") { // falling flakes
        for (let i = 0; i < 4; i++) {
          const fy = ((t * 22 * speed + i * 9) % 22);
          ctx.fillStyle = ["#e2e8f0", "#94a3b8", "#cbd5e1"][i % 3];
          ctx.fillRect(hx + 1 + (i % 2) * 3, y - 16 + fy, 1.6, 1.6);
        }
      }
      break;
    }
    case "topcoat": { // squeegee / seal sweep
      const sx = Math.sin(t * 3 * speed) * 5;
      const bx = cx - 1 + sx, by = y + 3;
      arm(ctx, lsh.x, lsh.y, bx - 3, by - 4, color);
      arm(ctx, sh.x, sh.y, bx + 3, by - 4, color);
      ctx.strokeStyle = METAL_DK; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(bx, by - 5); ctx.lineTo(bx, by); ctx.stroke();
      ctx.fillStyle = "#64748b"; ctx.fillRect(bx - 6, by, 12, 2); // blade
      ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 1; // gloss
      ctx.beginPath(); ctx.moveTo(bx - 7, by + 3); ctx.lineTo(bx + 7, by + 3); ctx.stroke();
      break;
    }
    case "cure": { // done — relaxed, green check above
      arm(ctx, lsh.x, lsh.y, cx - 6, y - 1, color);
      arm(ctx, sh.x, sh.y, cx + 6, y - 1, color);
      const cy = headY - 11 + Math.sin(t * 2) * 1.5;
      ctx.strokeStyle = "#16a34a"; ctx.lineWidth = 2; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy); ctx.lineTo(cx - 0.5, cy + 2.5); ctx.lineTo(cx + 4, cy - 3);
      ctx.stroke();
      break;
    }
    default: { // manage — tablet/clipboard
      const tap = working ? Math.sin(t * 6) * 1 : 0;
      arm(ctx, lsh.x, lsh.y, cx - 5, y - 4, color);
      arm(ctx, sh.x, sh.y, cx + 5, y - 4 + tap, color);
      ctx.fillStyle = "#334155"; ctx.fillRect(cx - 5, y - 7, 10, 7);
      ctx.fillStyle = "#93c5fd"; ctx.fillRect(cx - 4, y - 6, 8, 5);
      break;
    }
  }

  // head
  ctx.fillStyle = SKIN;
  ctx.beginPath(); ctx.arc(cx, headY, 6.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color; // hair
  ctx.beginPath(); ctx.arc(cx, headY - 2, 6.5, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#2c2c2a"; // eyes
  ctx.fillRect(cx - 2.8, headY - 1, 1.7, 1.7);
  ctx.fillRect(cx + 1.1, headY - 1, 1.7, 1.7);
  // status dot
  ctx.beginPath(); ctx.arc(cx + 8, headY - 6, 2.8, 0, Math.PI * 2);
  ctx.fillStyle = statusColor; ctx.fill();
  ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.stroke();
}

function bubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, working: boolean, t: number) {
  if (!working) return;
  const oy = Math.sin(t * 2) * 1.5;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y + oy, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#475569"; ctx.font = "bold 6px sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + oy + 0.5);
  ctx.textAlign = "start"; ctx.textBaseline = "alphabetic";
}

export default function AgentSprite({ color, activity = "manage", working = false, size = 60, statusColor = "#1D9E75" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const cx = size / 2;
    const footY = size * 0.62;
    if (reduce) {
      drawAgent(ctx, cx, footY, color, 0, false, statusColor, activity);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      const t = (performance.now() - start) / 1000;
      ctx.clearRect(0, 0, size, size);
      drawAgent(ctx, cx, footY, color, t, working, statusColor, activity);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [color, working, size, statusColor, activity]);

  return <canvas ref={ref} style={{ width: size, height: size }} aria-hidden="true" />;
}
