import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookOpen, FileText, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import * as api from "../lib/api";
import type { DocIndexEntry, DocKind, DocPage as Doc, SystemDetail } from "../lib/types";
import { useAuth } from "../lib/auth";
import MarkdownView from "../components/MarkdownView";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import { Skeleton } from "../components/Skeleton";

export default function DocsPage({ kind }: { kind: DocKind }) {
  const { slug = "" } = useParams();
  const { isAdmin } = useAuth();
  const [sys, setSys] = useState<SystemDetail | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const loadSys = useCallback(() => {
    setLoading(true);
    api.getSystem(slug)
      .then((d) => setSys(d))
      .catch(() => setSys(null))
      .finally(() => setLoading(false));
  }, [slug]);
  useEffect(() => { loadSys(); }, [loadSys]);

  const entries: DocIndexEntry[] = useMemo(
    () => (sys?.docs ?? []).filter((d) => d.kind === kind),
    [sys, kind],
  );

  // Pick the first doc when the list/kind changes.
  useEffect(() => {
    if (entries.length === 0) { setDocId(null); setDoc(null); return; }
    if (!docId || !entries.some((e) => e.id === docId)) setDocId(entries[0].id);
  }, [entries, docId]);

  // Load the selected doc body.
  useEffect(() => {
    if (!docId) return;
    setEditing(false);
    api.getDoc(docId).then((d) => { setDoc(d); setDraft(d.body_markdown); }).catch(() => setDoc(null));
  }, [docId]);

  const title = sys?.name ?? "Loading…";

  const save = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      await api.updateDoc(doc.id, { body_markdown: draft });
      setDoc({ ...doc, body_markdown: draft });
      setEditing(false);
    } finally { setSaving(false); }
  };

  const addPage = async () => {
    if (!sys) return;
    const t = window.prompt(`New ${kind === "sop" ? "SOP" : "Documentation"} page title:`);
    if (!t?.trim()) return;
    const slugified = t.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const r = await api.createDoc(sys.id, { kind, title: t.trim(), slug: slugified, body_markdown: `# ${t.trim()}\n\n` });
    loadSys();
    setDocId(r.id);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2">
        <Link to={`/floor/${slug}`} className="text-sm text-muted hover:text-fg">← {title}</Link>
        <div className="ml-auto flex rounded-lg border border-border bg-surface p-0.5">
          <Tab to={`/floor/${slug}/sop`} active={kind === "sop"} icon={FileText} label="SOP" />
          <Tab to={`/floor/${slug}/docs`} active={kind === "dev_doc"} icon={BookOpen} label="Documentation" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
          <Skeleton className="h-64 w-full" /><Skeleton className="h-96 w-full" />
        </div>
      ) : entries.length === 0 && !isAdmin ? (
        <EmptyState title="Nothing here yet" message="This section hasn't been written yet." icon={kind === "sop" ? FileText : BookOpen} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[220px_1fr]">
          {/* Section nav */}
          <nav className="space-y-1 md:sticky md:top-20 md:self-start">
            {entries.map((e) => (
              <button
                key={e.id}
                onClick={() => setDocId(e.id)}
                aria-current={e.id === docId ? "page" : undefined}
                className={`block w-full truncate rounded-lg px-3 py-2 text-left text-sm ${
                  e.id === docId ? "bg-surface-2 font-semibold text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {e.title}
              </button>
            ))}
            {isAdmin && (
              <button onClick={addPage} className="flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-left text-sm text-accent hover:bg-surface-2">
                <Plus className="h-4 w-4" /> Add page
              </button>
            )}
          </nav>

          {/* Content */}
          <article className="min-w-0 rounded-xl border border-border bg-surface p-5 sm:p-7">
            {!doc ? (
              <EmptyState title="Select a page" />
            ) : editing ? (
              <DocEditor
                value={draft} onChange={setDraft} saving={saving}
                onSave={save} onCancel={() => { setDraft(doc.body_markdown); setEditing(false); }}
              />
            ) : (
              <>
                {isAdmin && (
                  <div className="mb-3 flex justify-end gap-2">
                    <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium text-fg hover:bg-surface-2">
                      <Pencil className="h-4 w-4" /> Edit
                    </button>
                    <button onClick={() => setConfirmDel(true)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </div>
                )}
                <MarkdownView markdown={doc.body_markdown} />
              </>
            )}
          </article>
        </div>
      )}

      <ConfirmDialog
        open={confirmDel}
        title={`Delete "${doc?.title}"?`}
        confirmLabel="Delete" destructive
        onCancel={() => setConfirmDel(false)}
        onConfirm={async () => {
          if (doc) await api.deleteDoc(doc.id);
          setConfirmDel(false); setDocId(null); loadSys();
        }}
      />
    </div>
  );
}

function Tab({ to, active, icon: Icon, label }: { to: string; active: boolean; icon: typeof FileText; label: string }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ${
        active ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}

function DocEditor({
  value, onChange, onSave, onCancel, saving,
}: {
  value: string; onChange: (v: string) => void;
  onSave: () => void; onCancel: () => void; saving: boolean;
}) {
  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <button onClick={onCancel} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium text-fg hover:bg-surface-2">
          <X className="h-4 w-4" /> Cancel
        </button>
        <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-fg disabled:opacity-60">
          <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save"}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="num h-[60vh] w-full resize-none rounded-lg border border-border bg-bg p-3 text-sm leading-relaxed text-fg focus:border-accent"
        />
        <div className="h-[60vh] overflow-y-auto rounded-lg border border-border bg-bg p-4">
          <MarkdownView markdown={value} />
        </div>
      </div>
    </div>
  );
}
