import { useEffect, useRef } from "react";
import { drawAgent, type Activity } from "./AgentSprite";

// A little procedurally-drawn OFFICE ROOM (ARIA-style): wall + floor + rug,
// a desk with a monitor, a plant — and the agent working inside it, acting out
// its phase. Each project/phase node is one of these rooms.
interface Props {
  accent: string;          // hex room accent
  activity?: Activity;
  working?: boolean;
  statusColor?: string;
  width?: number;
  height?: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
function tint(hex: string, amt: number): string { // mix toward white
  const [r, g, b] = hexToRgb(hex);
  const m = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
function shade(hex: string, amt: number): string { // mix toward black
  const [r, g, b] = hexToRgb(hex);
  const m = (c: number) => Math.round(c * (1 - amt));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

function drawRoom(
  ctx: CanvasRenderingContext2D, w: number, h: number, accent: string,
  t: number, working: boolean, statusColor: string, activity: Activity,
) {
  const wallH = Math.round(h * 0.56);
  // wall
  ctx.fillStyle = tint(accent, 0.9);
  ctx.fillRect(0, 0, w, wallH);
  // window on the wall (accent-tinted glass)
  ctx.fillStyle = tint(accent, 0.55);
  ctx.fillRect(w - 52, 8, 30, wallH - 18);
  ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1;
  ctx.strokeRect(w - 52, 8, 30, wallH - 18);
  ctx.beginPath(); ctx.moveTo(w - 37, 8); ctx.lineTo(w - 37, wallH - 10); ctx.stroke();
  // baseboard
  ctx.fillStyle = shade(accent, 0.15);
  ctx.fillRect(0, wallH - 3, w, 3);
  // floor
  ctx.fillStyle = "#ece6dc";
  ctx.fillRect(0, wallH, w, h - wallH);
  // rug
  ctx.beginPath();
  ctx.ellipse(w * 0.42, wallH + (h - wallH) * 0.62, w * 0.3, (h - wallH) * 0.34, 0, 0, Math.PI * 2);
  ctx.fillStyle = tint(accent, 0.72);
  ctx.fill();

  const floorY = wallH + (h - wallH) * 0.66; // agent feet

  // plant (left)
  const px = 13;
  ctx.fillStyle = "#c0744b";
  ctx.beginPath(); ctx.moveTo(px - 4, floorY + 6); ctx.lineTo(px + 4, floorY + 6); ctx.lineTo(px + 3, floorY + 12); ctx.lineTo(px - 3, floorY + 12); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#4caf6a";
  [[-2, -2], [3, -3], [0, -6]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(px + dx, floorY + 2 + dy, 4, 0, Math.PI * 2); ctx.fill(); });

  // desk + monitor (right)
  const dx = w - 40;
  ctx.fillStyle = "#b58a63"; // desk top
  ctx.fillRect(dx, floorY - 1, 32, 4);
  ctx.fillStyle = "#9c7551"; // legs
  ctx.fillRect(dx + 1, floorY + 3, 2, 8);
  ctx.fillRect(dx + 27, floorY + 3, 2, 8);
  ctx.fillStyle = "#334155"; // monitor body
  ctx.fillRect(dx + 9, floorY - 13, 14, 10);
  const glow = working ? 0.55 + Math.sin(t * 4) * 0.25 : 0.4;
  ctx.fillStyle = `rgba(96,165,250,${glow})`; // screen
  ctx.fillRect(dx + 10, floorY - 12, 12, 8);
  ctx.fillStyle = "#475569"; // stand
  ctx.fillRect(dx + 15, floorY - 3, 2, 3);

  // the agent, working in the room
  drawAgent(ctx, Math.round(w * 0.42), floorY, accent, t, working, statusColor, activity);
}

export default function OfficeScene({
  accent, activity = "manage", working = false, statusColor = "#1D9E75", width = 230, height = 96,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const safeAccent = accent && accent.startsWith("#") ? accent : "#475569";
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      drawRoom(ctx, width, height, safeAccent, 0, false, statusColor, activity);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      const t = (performance.now() - start) / 1000;
      ctx.clearRect(0, 0, width, height);
      drawRoom(ctx, width, height, safeAccent, t, working, statusColor, activity);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [accent, activity, working, statusColor, width, height]);

  return <canvas ref={ref} style={{ width, height, display: "block" }} aria-hidden="true" />;
}
