import { useEffect, useRef } from "react";

// A single office seen FROM ABOVE — a furnished room with an NPC that walks a
// loop (desk → water cooler → centre → bookshelf → back), pausing at the desk
// to work. Each department gets a fitting avatar (hard hat for Operations,
// headset for Sales, …), a dashboard board showing its work, and its own props.
// `dept` is the system/division slug.
interface Props {
  accent: string;
  dept?: string;
  working?: boolean;
  statusColor?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
function tint(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const m = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const m = (c: number) => Math.round(c * (1 - amt));
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}
function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
// Stable per-office seed so each room's layout + walk differ but never flicker.
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}
function gear(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  const teeth = 8;
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const ang = (i * Math.PI) / teeth;
    const rad = i % 2 ? r : r * 0.72;
    ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#dfe7ef";
  ctx.beginPath(); ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ── the department's "work" shown on a dashboard board ──
function emblem(
  ctx: CanvasRenderingContext2D, dept: string, ex: number, ey: number, R: number,
  t: number, accent: string, working: boolean,
) {
  const p = working ? t : 0;
  ctx.save();
  ctx.translate(ex, ey);
  switch (dept) {
    case "news-feed": {
      ctx.strokeStyle = shade(accent, 0.1); ctx.lineWidth = 1;
      [R * 0.42, R * 0.72, R].forEach((r) => { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); });
      ctx.beginPath(); ctx.moveTo(-R, 0); ctx.lineTo(R, 0); ctx.moveTo(0, -R); ctx.lineTo(0, R); ctx.stroke();
      const a = (p * 1.7) % (Math.PI * 2);
      ctx.strokeStyle = accent; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R); ctx.stroke();
      ctx.fillStyle = "#ef4444";
      [[0.5, -0.35], [-0.45, 0.5]].forEach(([bx, by], i) => {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(p * 3 + i);
        ctx.beginPath(); ctx.arc(bx * R, by * R, 1.8, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      break;
    }
    case "finance": {
      const bars = [0.5, 0.78, 0.62, 1.0];
      const bw = (R * 1.7) / bars.length;
      bars.forEach((bh, i) => {
        const pulse = working ? 0.85 + 0.15 * Math.sin(p * 2 + i) : 1;
        const hh = R * 1.35 * bh * pulse;
        ctx.fillStyle = i % 2 ? accent : tint(accent, 0.32);
        ctx.fillRect(-R * 0.85 + i * bw, R * 0.7 - hh, bw - 2.5, hh);
      });
      ctx.fillStyle = "#f4c430"; ctx.beginPath(); ctx.arc(R * 0.55, -R * 0.5, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#9a7b10"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("$", R * 0.55, -R * 0.45);
      break;
    }
    case "sales-marketing": {
      ctx.strokeStyle = accent; ctx.lineWidth = 2.2; ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-R * 0.85, R * 0.5); ctx.lineTo(-R * 0.2, -R * 0.05); ctx.lineTo(R * 0.2, R * 0.2); ctx.lineTo(R * 0.85, -R * 0.6);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(R * 0.85, -R * 0.6); ctx.lineTo(R * 0.48, -R * 0.55);
      ctx.moveTo(R * 0.85, -R * 0.6); ctx.lineTo(R * 0.78, -R * 0.23); ctx.stroke();
      const pr = (p * 0.7) % 1;
      ctx.globalAlpha = (1 - pr) * 0.55; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.arc(-R * 0.85, R * 0.5, 3 + pr * 10, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      break;
    }
    case "operations": {
      gear(ctx, -R * 0.22, -R * 0.08, R * 0.6, p * 1.1, accent);
      gear(ctx, R * 0.5, R * 0.35, R * 0.42, -p * 1.7 + 0.4, tint(accent, 0.28));
      break;
    }
    case "admin-it": {
      ctx.fillStyle = shade(accent, 0.45); rr(ctx, -R * 0.5, -R * 0.8, R, R * 1.6, 2); ctx.fill();
      for (let i = 0; i < 4; i++) {
        const y = -R * 0.62 + i * R * 0.4;
        ctx.fillStyle = "#1e293b"; ctx.fillRect(-R * 0.38, y, R * 0.76, R * 0.26);
        const on = working ? Math.sin(p * 4 + i * 1.3) > 0 : i % 2 === 0;
        ctx.fillStyle = on ? "#22c55e" : "#f59e0b";
        ctx.beginPath(); ctx.arc(R * 0.27, y + R * 0.13, 1.5, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case "proposal-tool": {
      ctx.fillStyle = "#ffffff"; rr(ctx, -R * 0.55, -R * 0.8, R * 1.1, R * 1.6, 2); ctx.fill();
      ctx.strokeStyle = tint(accent, 0.3); ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = tint(accent, 0.1); ctx.lineWidth = 1.3;
      const lines = 4;
      const write = working ? 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(p)) : 1;
      for (let i = 0; i < lines; i++) {
        const yy = -R * 0.5 + i * R * 0.32;
        const full = R * 0.8;
        const len = i === lines - 1 ? full * write : full * (0.7 + 0.25 * Math.sin(i * 1.7));
        ctx.beginPath(); ctx.moveTo(-R * 0.4, yy); ctx.lineTo(-R * 0.4 + len, yy); ctx.stroke();
      }
      ctx.fillStyle = accent; ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("$", R * 0.3, R * 0.55);
      break;
    }
    case "ai-implementation": {
      const N = 5;
      for (let i = 0; i < N; i++) {
        const a = p * 0.9 + (i * Math.PI * 2) / N;
        const ox = Math.cos(a) * R * 0.85, oy = Math.sin(a) * R * 0.6;
        ctx.strokeStyle = tint(accent, 0.45); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ox, oy); ctx.stroke();
        ctx.fillStyle = tint(accent, 0.1);
        ctx.beginPath(); ctx.arc(ox, oy, 2.3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      break;
    }
    default: {
      ctx.fillStyle = rgba(accent, 0.16);
      ctx.beginPath(); ctx.arc(0, 0, R * 0.55, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

// ── furniture ──
function bookshelf(ctx: CanvasRenderingContext2D, h: number) {
  const x = 4, y = h * 0.42, ww = 11, hh = h * 0.4;
  ctx.fillStyle = "#7a4f30"; rr(ctx, x, y, ww, hh, 2); ctx.fill();
  const books = ["#c0504d", "#4f81bd", "#9bbb59", "#8064a2", "#f79646", "#2c8c99"];
  const shelves = 3, sh = hh / shelves;
  for (let s = 0; s < shelves; s++) {
    let bx = x + 1.5;
    const by = y + s * sh + 1.5;
    let k = s * 7 + 1;
    while (bx < x + ww - 2) {
      const bw = 1.5 + (k % 3) * 0.7;
      ctx.fillStyle = books[k % books.length];
      ctx.fillRect(bx, by, bw, sh - 3);
      bx += bw + 0.8; k++;
    }
  }
}
function waterCooler(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const x = w - 19, y = h * 0.30;
  ctx.fillStyle = "#e2e8f0"; rr(ctx, x, y, 9, 13, 2); ctx.fill();
  ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = "#7dd3fc"; ctx.beginPath(); ctx.arc(x + 4.5, y - 1.5, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#38bdf8"; ctx.beginPath(); ctx.arc(x + 4.5, y - 1.5, 5, 0, Math.PI * 2); ctx.stroke();
}
function plant(ctx: CanvasRenderingContext2D, px: number, py: number) {
  ctx.fillStyle = "#c0744b"; rr(ctx, px - 6, py - 1, 12, 10, 2); ctx.fill();
  ctx.fillStyle = "#4caf6a";
  [[-4, -4], [4, -5], [0, -9], [-1, -1]].forEach(([dx, dy]) => {
    ctx.beginPath(); ctx.arc(px + dx, py + dy, 4.5, 0, Math.PI * 2); ctx.fill();
  });
}
function board(ctx: CanvasRenderingContext2D, w: number, h: number, dept: string, t: number, accent: string, working: boolean) {
  const bx = w * 0.63, by = 6, bw = w * 0.30, bh = h * 0.30;
  ctx.fillStyle = "#2b3344"; rr(ctx, bx, by, bw, bh, 3); ctx.fill();
  ctx.fillStyle = tint(accent, 0.86); rr(ctx, bx + 2, by + 2, bw - 4, bh - 4, 2); ctx.fill();
  ctx.save();
  rr(ctx, bx + 2, by + 2, bw - 4, bh - 4, 2); ctx.clip();
  emblem(ctx, dept, bx + bw / 2, by + bh / 2, Math.min(bw, bh) * 0.34, t, accent, working);
  ctx.restore();
}

// ── extra department-specific furniture ──
function filingCabinet(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#9aa6b2"; rr(ctx, x, y, 12, 26, 1.5); ctx.fill();
  ctx.strokeStyle = "#7c8794"; ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) { const dy = y + 3 + i * 8; ctx.strokeRect(x + 1.5, dy, 9, 6); ctx.fillStyle = "#5b6673"; ctx.fillRect(x + 5, dy + 2.5, 2, 1); }
}
function printer(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 4, y - 4, 8, 6);
  ctx.strokeStyle = "#cbd5e1"; ctx.lineWidth = 1; ctx.strokeRect(x + 4, y - 4, 8, 6);
  ctx.fillStyle = "#cbd5e1"; rr(ctx, x, y, 16, 11, 2); ctx.fill();
  ctx.fillStyle = "#94a3b8"; ctx.fillRect(x + 2, y + 2, 12, 3);
}
function safe(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#3f4855"; rr(ctx, x, y, 18, 18, 2); ctx.fill();
  ctx.strokeStyle = "#2a313b"; ctx.lineWidth = 1; ctx.strokeRect(x + 2, y + 2, 14, 14);
  ctx.fillStyle = "#cbd5e1"; ctx.beginPath(); ctx.arc(x + 9, y + 9, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#64748b"; for (let a = 0; a < 6; a++) { const ang = (a * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(x + 9, y + 9); ctx.lineTo(x + 9 + Math.cos(ang) * 3.5, y + 9 + Math.sin(ang) * 3.5); ctx.stroke(); }
}
function trophy(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#f4c430";
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 12, y); ctx.lineTo(x + 9, y + 9); ctx.lineTo(x + 3, y + 9); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#caa206"; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(x, y + 3, 3, Math.PI * 0.5, Math.PI * 1.5, true); ctx.stroke();
  ctx.beginPath(); ctx.arc(x + 12, y + 3, 3, Math.PI * 1.5, Math.PI * 0.5, true); ctx.stroke();
  ctx.fillStyle = "#caa206"; ctx.fillRect(x + 5, y + 9, 2, 4); ctx.fillRect(x + 3, y + 13, 6, 2);
}
function toolbench(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#9c6b3f"; rr(ctx, x, y, 30, 8, 1.5); ctx.fill();
  ctx.fillStyle = shade("#9c6b3f", 0.2); ctx.fillRect(x, y + 8, 30, 2);
  ctx.strokeStyle = "#475569"; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(x + 4, y - 1); ctx.lineTo(x + 8, y - 4); ctx.stroke();
  ctx.fillStyle = "#ef4444"; ctx.fillRect(x + 14, y - 3, 4, 3);
  ctx.strokeStyle = "#475569"; ctx.beginPath(); ctx.moveTo(x + 24, y - 1); ctx.lineTo(x + 24, y - 4); ctx.stroke();
}
function cones(ctx: CanvasRenderingContext2D, x: number, y: number) {
  for (let i = 0; i < 2; i++) {
    const cx = x + i * 9;
    ctx.fillStyle = "#f97316"; ctx.beginPath(); ctx.moveTo(cx, y - 7); ctx.lineTo(cx + 4, y); ctx.lineTo(cx - 4, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillRect(cx - 2.5, y - 4, 5, 1.4);
  }
}
function mapBoard(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#2b3344"; rr(ctx, x, y, 24, 16, 2); ctx.fill();
  ctx.fillStyle = "#cfe8ff"; ctx.fillRect(x + 2, y + 2, 20, 12);
  ctx.fillStyle = "#7bbf6a";
  ctx.beginPath(); ctx.ellipse(x + 7, y + 7, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 16, y + 9, 3.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(x + 12, y + 6, 1, 0, Math.PI * 2); ctx.fill();
}
function meetingTable(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.fillStyle = "#586273";
  [[-19, 0], [19, 0], [-10, -11], [10, -11], [-10, 11], [10, 11]].forEach(([dx, dy]) => {
    ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 3, 0, Math.PI * 2); ctx.fill();
  });
  ctx.fillStyle = "#b98e64"; ctx.beginPath(); ctx.ellipse(cx, cy, 16, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = shade("#b98e64", 0.15); ctx.beginPath(); ctx.ellipse(cx, cy, 11, 5.5, 0, 0, Math.PI * 2); ctx.fill();
}
// Place the department's signature furniture in the lower-inner zone.
function deptFeature(ctx: CanvasRenderingContext2D, dept: string, w: number, h: number) {
  switch (dept) {
    case "operations": toolbench(ctx, w * 0.20, h * 0.82); cones(ctx, w * 0.54, h * 0.86); break;
    case "finance": safe(ctx, w * 0.21, h * 0.78); break;
    case "sales-marketing": trophy(ctx, w * 0.23, h * 0.80); break;
    case "admin-it": filingCabinet(ctx, w * 0.21, h * 0.66); break;
    case "proposal-tool": printer(ctx, w * 0.21, h * 0.82); break;
    case "news-feed": mapBoard(ctx, w * 0.19, h * 0.80); break;
    case "ai-implementation": meetingTable(ctx, w * 0.42, h * 0.78); break;
    default: break;
  }
}

// ── the walking NPC ──
const SKINS = ["#f1c9a5", "#e8b890", "#d49a73", "#b97f55"];
const HAIRS = ["#3b2a1a", "#6b4423", "#1a1a1a", "#705038", "#9a8a72"];
function npcStyle(dept: string, accent: string) {
  const h = [...dept].reduce((a, c) => a + c.charCodeAt(0), 0);
  return { shirt: accent, skin: SKINS[h % SKINS.length], hair: HAIRS[(h >> 1) % HAIRS.length] };
}

// Position along the room loop at time t (px coords). Idle dwell at the desk.
function pathState(t: number, norm: number[][], w: number, h: number, speed: number, dwell: number) {
  const pts = norm.map(([nx, ny]) => [nx * w, ny * h]);
  const segs: { a: number[]; b: number[]; dur: number }[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ a, b, dur: Math.max(0.1, d / speed) });
  }
  const walk = segs.reduce((s, x) => s + x.dur, 0);
  const cycle = walk + dwell;
  let tt = t % cycle;
  if (tt < dwell) return { x: pts[0][0], y: pts[0][1], moving: false, dir: -Math.PI / 2 };
  tt -= dwell;
  for (const s of segs) {
    if (tt <= s.dur) {
      const f = tt / s.dur;
      return {
        x: s.a[0] + (s.b[0] - s.a[0]) * f,
        y: s.a[1] + (s.b[1] - s.a[1]) * f,
        moving: true,
        dir: Math.atan2(s.b[1] - s.a[1], s.b[0] - s.a[0]),
      };
    }
    tt -= s.dur;
  }
  return { x: pts[0][0], y: pts[0][1], moving: false, dir: -Math.PI / 2 };
}

// Front-facing character (billboard) standing on the top-down floor at its feet
// position (x, y). It walks around the room with a little step + arm-swing cycle
// and faces the viewer so you can see who's working in each office.
function drawNPC(
  ctx: CanvasRenderingContext2D, x: number, y: number, _dir: number, moving: boolean,
  t: number, dept: string, accent: string, statusColor: string,
) {
  const { shirt, skin, hair } = npcStyle(dept, accent);
  const step = moving ? Math.sin(t * 8) : 0;
  const armSwing = moving ? step * 2.4 : Math.sin(t * 6) * 1.1; // walk swing / desk typing
  const bob = moving ? Math.abs(Math.sin(t * 8)) * 1.3 : Math.sin(t * 2) * 0.4;
  const dk = "#283142";

  // floor shadow + status ring at the feet
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.beginPath(); ctx.ellipse(x, y + 1, 8, 3.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = statusColor; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y + 1, 9.6, 4, 0, 0, Math.PI * 2); ctx.stroke();

  const fy = y - bob;                 // feet baseline (whole body bobs)
  const legTop = fy - 8;
  const torsoTop = fy - 16;
  const hcy = fy - 21;                // head centre

  // legs + shoes (alternate while walking)
  const off = moving ? step * 1.4 : 0;
  ctx.fillStyle = shade(shirt, 0.5);
  rr(ctx, x - 3.6 + off, legTop, 3, 8.5, 1.2); ctx.fill();
  rr(ctx, x + 0.6 - off, legTop, 3, 8.5, 1.2); ctx.fill();
  ctx.fillStyle = "#3a3a3a";
  rr(ctx, x - 4 + off, fy - 1.8, 3.8, 2.6, 1); ctx.fill();
  rr(ctx, x + 0.2 - off, fy - 1.8, 3.8, 2.6, 1); ctx.fill();

  // torso (shirt)
  ctx.fillStyle = shirt; rr(ctx, x - 5, torsoTop, 10, 10, 3); ctx.fill();
  ctx.fillStyle = skin; ctx.fillRect(x - 1.6, torsoTop - 1.4, 3.2, 2.4); // neck

  // tie for the suited departments
  if (dept === "finance" || dept === "proposal-tool" || dept === "ai-implementation") {
    ctx.fillStyle = shade(accent, 0.35);
    ctx.beginPath();
    ctx.moveTo(x, torsoTop); ctx.lineTo(x - 1.5, torsoTop + 2.2); ctx.lineTo(x, torsoTop + 6.5); ctx.lineTo(x + 1.5, torsoTop + 2.2);
    ctx.closePath(); ctx.fill();
  }
  // hi-vis vest stripe for operations
  if (dept === "operations") {
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(x - 4, torsoTop + 3, 8, 1.6);
  }

  // arms + hands (sleeves = shirt)
  ctx.fillStyle = shirt;
  rr(ctx, x - 7, torsoTop + 1 + armSwing, 2.6, 7.5, 1.3); ctx.fill();
  rr(ctx, x + 4.4, torsoTop + 1 - armSwing, 2.6, 7.5, 1.3); ctx.fill();
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(x - 5.7, torsoTop + 8.5 + armSwing, 1.7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 5.7, torsoTop + 8.5 - armSwing, 1.7, 0, Math.PI * 2); ctx.fill();

  // head
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(x, hcy, 5.3, 0, Math.PI * 2); ctx.fill();
  // hair (top half)
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.arc(x, hcy - 0.3, 5.3, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
  // face
  ctx.fillStyle = dk;
  ctx.beginPath(); ctx.arc(x - 1.9, hcy + 0.6, 0.95, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 1.9, hcy + 0.6, 0.95, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = dk; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(x, hcy + 1.7, 1.7, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();

  // department headwear / eyewear (front-facing)
  if (dept === "operations") { // hard hat
    ctx.fillStyle = "#f5c518";
    ctx.beginPath(); ctx.arc(x, hcy - 0.6, 5.7, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
    ctx.fillRect(x - 6.4, hcy - 1, 12.8, 1.7);
    ctx.fillStyle = "#caa206"; ctx.fillRect(x - 0.8, hcy - 5.6, 1.6, 4.3);
  } else if (dept === "sales-marketing") { // headset
    ctx.strokeStyle = dk; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(x, hcy - 0.3, 6.2, Math.PI * 1.12, Math.PI * 1.88); ctx.stroke();
    ctx.fillStyle = dk;
    ctx.beginPath(); ctx.arc(x - 5.6, hcy + 0.4, 1.7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 5.6, hcy + 0.4, 1.7, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(x - 5.4, hcy + 1.6); ctx.quadraticCurveTo(x - 2.6, hcy + 4.4, x - 0.6, hcy + 3.6); ctx.stroke();
  } else if (dept === "admin-it") { // cap
    ctx.fillStyle = "#334155";
    ctx.beginPath(); ctx.arc(x, hcy - 0.6, 5.6, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill();
    ctx.fillRect(x - 1, hcy - 1.2, 7, 1.6); // brim
    ctx.strokeStyle = dk; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(x - 1.9, hcy + 0.6, 1.5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 1.9, hcy + 0.6, 1.5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 0.4, hcy + 0.6); ctx.lineTo(x + 0.4, hcy + 0.6); ctx.stroke();
  } else if (dept === "finance" || dept === "proposal-tool") { // glasses
    ctx.strokeStyle = dk; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(x - 1.9, hcy + 0.6, 1.6, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 1.9, hcy + 0.6, 1.6, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 0.3, hcy + 0.6); ctx.lineTo(x + 0.3, hcy + 0.6); ctx.stroke();
  }
}

function drawTopDown(
  ctx: CanvasRenderingContext2D, w: number, h: number, accent: string, dept: string,
  t: number, working: boolean, statusColor: string,
) {
  // per-office seed → distinct (but stable) layout + walk
  const seed = hashStr(dept || "x");
  const leftCab = (seed & 1) === 1;
  const twoPlants = (seed & 2) === 1;
  const coolerOn = (seed & 4) === 0;
  const rugDx = (((seed >> 3) % 5) - 2) * 0.018;
  const rugDy = (((seed >> 6) % 5) - 2) * 0.018;

  // wood floor + planks
  ctx.fillStyle = "#efe9df"; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(120,90,60,0.07)"; ctx.lineWidth = 1;
  for (let x = 16; x < w; x += 17) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }

  // rug (centre, jittered per office)
  rr(ctx, w * (0.28 + rugDx), h * (0.46 + rugDy), w * 0.40, h * 0.40, 8);
  ctx.fillStyle = tint(accent, 0.78); ctx.fill();
  ctx.strokeStyle = tint(accent, 0.5); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.3; ctx.stroke(); ctx.setLineDash([]);

  // desk against the top wall
  const deskW = w * 0.42, deskH = 13, deskX = w * 0.14, deskY = 8;
  ctx.fillStyle = "#b98e64"; rr(ctx, deskX, deskY, deskW, deskH, 3); ctx.fill();
  ctx.fillStyle = shade("#b98e64", 0.14); ctx.fillRect(deskX, deskY + deskH - 3, deskW, 3);
  const mx = deskX + deskW * 0.5 - 8, my = deskY + 2;
  ctx.fillStyle = "#334155"; rr(ctx, mx, my, 16, 4, 1); ctx.fill();
  const glow = working ? 0.5 + Math.sin(t * 4) * 0.28 : 0.32;
  ctx.fillStyle = rgba(accent, Math.max(0.2, glow)); ctx.fillRect(mx + 1, my + 1, 14, 2.4);
  const chx = deskX + deskW * 0.5, chy = deskY + deskH + 9;
  ctx.fillStyle = "#586273"; rr(ctx, chx - 6, chy - 5, 12, 11, 4); ctx.fill();

  // furniture (varied per office) + the department dashboard + signature piece
  if (leftCab) filingCabinet(ctx, 4, h * 0.46); else bookshelf(ctx, h);
  if (coolerOn) waterCooler(ctx, w, h);
  board(ctx, w, h, dept, t, accent, working);
  deptFeature(ctx, dept, w, h);
  plant(ctx, w - 14, h - 13);
  if (twoPlants) plant(ctx, 13, h - 13);

  // the NPC — each office walks a different path/offset/speed (no lock-step)
  const tOff = (seed % 1000) / 90;
  const baseSpeed = 16 + (seed % 9) * 2.4;
  const speed = (working ? 1.25 : 1) * baseSpeed;
  const dwell = 1.4 + ((seed >> 4) % 7) * 0.45;
  const base = [[0.40, 0.40], [0.78, 0.52], [0.52, 0.74], [0.22, 0.60]];
  const loop = base.map((p, i) => {
    const jx = (((seed >> (i * 4)) % 5) - 2) * 0.02;
    const jy = (((seed >> (i * 4 + 2)) % 5) - 2) * 0.02;
    return [p[0] + jx, p[1] + jy];
  });
  const st = pathState(t + tOff, loop, w, h, speed, dwell);
  drawNPC(ctx, st.x, st.y, st.dir, st.moving, t + tOff, dept, accent, statusColor);
}

// Logical scene size — the drawing is authored at this size, then uniformly
// scaled to fill whatever box the canvas occupies (letterboxed with floor).
const LW = 340, LH = 196;

export default function TopDownRoom({ accent, dept = "", working = false, statusColor = "#1D9E75" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const wrap = wrapRef.current, canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const safe = accent && accent.startsWith("#") ? accent : "#475569";
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 1, H = 1;

    const paint = (t: number) => {
      // base transform; floor-fill the whole box (covers letterbox bars)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#efe9df";
      ctx.fillRect(0, 0, W, H);
      // uniform fit + centre, then draw the scene at logical size
      const s = Math.min(W / LW, H / LH);
      const ox = (W - LW * s) / 2, oy = (H - LH * s) / 2;
      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      drawTopDown(ctx, LW, LH, safe, dept, t, working, statusColor);
    };

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
    };
    resize();

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const ro = new ResizeObserver(() => { resize(); if (reduce) paint(0); });
    ro.observe(wrap);

    if (reduce) { paint(0); return () => ro.disconnect(); }
    let raf = 0;
    const start = performance.now();
    const loop = () => { paint((performance.now() - start) / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [accent, dept, working, statusColor]);

  return (
    <div ref={wrapRef} className="absolute inset-0" aria-hidden="true">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
