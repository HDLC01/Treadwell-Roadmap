import { useEffect, useState } from "react";
import { Megaphone, X, Pencil, Check } from "lucide-react";
import { getNotice, setNotice as saveNotice } from "../lib/api";
import type { SiteNotice } from "../lib/types";
import { useAuth } from "../lib/auth";

const DISMISS_KEY = "roadmap-notice-dismissed"; // stores the updated_at of the dismissed notice

const LEVEL_STYLE: Record<string, string> = {
  info: "bg-sky-500/15 text-sky-900 dark:text-sky-100 border-sky-500/30",
  update: "bg-accent/15 text-accent border-accent/30",
  warning: "bg-amber-500/20 text-amber-900 dark:text-amber-100 border-amber-500/40",
};

// Site-wide notice bar for updates. Shown to anyone signed in; admins can edit it
// inline. Dismiss is remembered per browser (until a newer notice is posted).
export default function NoticeBar() {
  const { isAdmin } = useAuth();
  const [notice, setNotice] = useState<SiteNotice | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState("");
  const [level, setLevel] = useState("info");
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () =>
    getNotice()
      .then((n) => {
        setNotice(n);
        setMsg(n.message || "");
        setLevel(n.level || "info");
        setActive(!!n.active);
        setDismissed(!!n.updated_at && localStorage.getItem(DISMISS_KEY) === n.updated_at);
      })
      .catch(() => setNotice(null));

  useEffect(() => { load(); }, []);

  const dismiss = () => {
    if (notice?.updated_at) localStorage.setItem(DISMISS_KEY, notice.updated_at);
    setDismissed(true);
  };
  const save = async () => {
    setBusy(true);
    try {
      await saveNotice({ message: msg.trim(), level, active });
      localStorage.removeItem(DISMISS_KEY); // a fresh post should re-show for everyone
      await load();
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  if (!notice) return null;

  if (editing) {
    return (
      <div className="shrink-0 border-b border-border bg-surface px-4 py-2">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={msg} onChange={(e) => setMsg(e.target.value)} autoFocus
            placeholder="Announcement for the team…"
            className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <select value={level} onChange={(e) => setLevel(e.target.value)}
            className="rounded-lg border border-border bg-bg px-2 py-1.5 text-sm text-fg">
            <option value="info">Info</option>
            <option value="update">Update</option>
            <option value="warning">Warning</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Show it
          </label>
          <button onClick={save} disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
            <Check className="h-4 w-4" /> {busy ? "Saving…" : "Save"}
          </button>
          <button onClick={() => { setEditing(false); load(); }}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-fg hover:bg-surface-2">Cancel</button>
        </div>
      </div>
    );
  }

  const show = notice.active && notice.message.trim().length > 0;
  if (show && !dismissed) {
    const cls = LEVEL_STYLE[notice.level] || LEVEL_STYLE.info;
    return (
      <div className={`shrink-0 border-b px-4 py-2 ${cls}`}>
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          <Megaphone className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 text-sm font-medium">{notice.message}</span>
          {isAdmin && (
            <button onClick={() => setEditing(true)} title="Edit notice" aria-label="Edit notice"
              className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10"><Pencil className="h-3.5 w-3.5" /></button>
          )}
          <button onClick={dismiss} title="Dismiss" aria-label="Dismiss notice"
            className="rounded p-1 hover:bg-black/10 dark:hover:bg-white/10"><X className="h-4 w-4" /></button>
        </div>
      </div>
    );
  }

  // Full bar not shown (off, empty, or dismissed) — admins keep a slim entry point.
  if (isAdmin) {
    return (
      <div className="shrink-0 border-b border-border bg-surface px-4 py-1 text-center">
        <button onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted hover:text-accent">
          <Megaphone className="h-3 w-3" /> {notice.active ? "Notice hidden — manage" : "Notice bar is off — add an update"}
        </button>
      </div>
    );
  }
  return null;
}
