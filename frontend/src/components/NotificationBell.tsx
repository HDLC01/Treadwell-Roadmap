import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell, BellOff, Plus, Pencil, Trash2, Star, ArrowLeftRight, Flag, type LucideIcon,
} from "lucide-react";
import { getNotifications, markNotificationsSeen } from "../lib/api";
import type { RoadmapNotification, Status } from "../lib/types";
import { useAuth } from "../lib/auth";
import { formatAuthor, timeAgo, STATUS_LABELS } from "../lib/format";

const POLL_MS = 60_000;

function statusWord(s?: unknown): string {
  return (typeof s === "string" && STATUS_LABELS[s as Status]) || "";
}

// Turn one activity row into a friendly line + a matching action icon.
function describe(n: RoadmapNotification): { text: string; Icon: LucideIcon } {
  const who = formatAuthor(n.actor_email) || "Someone";
  const noun = n.entity_type === "system" ? "tool" : n.entity_type === "division" ? "division" : "project";
  const what = n.title ? `"${n.title}"` : `a ${noun}`;
  const detail = (n.detail ?? {}) as Record<string, unknown>;
  switch (n.action) {
    case "created": return { text: `${who} added ${what}`, Icon: Plus };
    case "updated": return { text: `${who} edited ${what}`, Icon: Pencil };
    case "deleted": return { text: `${who} deleted ${what}`, Icon: Trash2 };
    case "status_change": {
      const to = statusWord(detail.status);
      return { text: `${who} moved ${what}${to ? ` to ${to}` : ""}`, Icon: ArrowLeftRight };
    }
    case "priority": {
      const starred = detail.priority === true || detail.priority === "true";
      return { text: `${who} ${starred ? "starred" : "unstarred"} ${what}`, Icon: Star };
    }
    case "note": return { text: `${who} added a note on ${what}`, Icon: Flag };
    default: return { text: `${who} updated ${what}`, Icon: Bell };
  }
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<RoadmapNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    try {
      const r = await getNotifications(20);
      setItems(r.items);
      setUnread(r.unread_count);
    } catch {
      /* offline / not signed in yet — ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    poll();
    const t = window.setInterval(poll, POLL_MS);
    return () => window.clearInterval(t);
  }, [poll]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openPanel = async () => {
    setOpen(true);
    try {
      const r = await getNotifications(20);
      setItems(r.items);
      if (r.unread_count > 0) await markNotificationsSeen().catch(() => {});
    } catch {
      /* ignore */
    } finally {
      setUnread(0);
    }
  };

  const markAll = async () => {
    await markNotificationsSeen().catch(() => {});
    setUnread(0);
    setItems((cur) => cur.map((n) => ({ ...n, unread: false })));
  };

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors hover:text-fg"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-surface"
            aria-hidden="true"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1.5 w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
            <span className="text-sm font-bold text-fg">Notifications</span>
            {items.some((n) => n.unread) && (
              <button type="button" onClick={markAll} className="text-xs font-semibold text-accent hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex justify-center py-10">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <BellOff className="h-7 w-7 text-muted/60" />
                <p className="text-sm font-medium text-fg">You're all caught up</p>
                <p className="text-xs text-muted">Team activity on projects and tools shows up here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => {
                  const { text, Icon } = describe(n);
                  const initial = (n.actor_email?.[0] || "?").toUpperCase();
                  return (
                    <li key={n.id} className={`flex items-start gap-2.5 px-3.5 py-2.5 ${n.unread ? "bg-accent/5" : ""}`}>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                        {initial}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-fg">{text}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                          <Icon className="h-3 w-3" aria-hidden="true" />
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                      {n.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
