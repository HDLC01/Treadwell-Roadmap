import { useCallback, useEffect, useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import * as api from "../lib/api";
import type { Role, User } from "../lib/types";
import { ApiError } from "../lib/api";
import EmptyState from "../components/EmptyState";
import { Skeleton } from "../components/Skeleton";
import ConfirmDialog from "../components/ConfirmDialog";
import { relativeDate } from "../lib/format";

const PAGE_SIZE = 25;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("viewer");
  const [confirmDel, setConfirmDel] = useState<User | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getUsers().then((r) => setUsers(r.users)).catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await api.createUser({ email: email.trim(), role });
      setEmail("");
      load();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not add user");
    }
  };

  const change = async (u: User, patch: Record<string, unknown>) => {
    setErr(null);
    try { await api.updateUser(u.id, patch); load(); }
    catch (e2) { setErr(e2 instanceof ApiError ? e2.message : "Update failed"); }
  };

  const paged = users.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const pages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-fg">Team & access</h1>
        <p className="mt-1 text-sm text-muted">
          Invite teammates by email. They sign in with Google (@wetreadwell.com). Roles control who can edit.
        </p>
      </div>

      <form onSubmit={invite} className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface p-4">
        <div className="flex-1">
          <label htmlFor="inv-email" className="mb-1 block text-xs font-medium text-muted">Email</label>
          <input id="inv-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="name@wetreadwell.com"
            className="h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm text-fg focus:border-accent" />
        </div>
        <div>
          <label htmlFor="inv-role" className="mb-1 block text-xs font-medium text-muted">Role</label>
          <select id="inv-role" value={role} onChange={(e) => setRole(e.target.value as Role)}
            className="h-10 rounded-lg border border-border bg-bg px-2 text-sm text-fg">
            <option value="viewer">Viewer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-semibold text-accent-fg">
          <UserPlus className="h-4 w-4" /> Add
        </button>
      </form>

      {err && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{err}</p>}

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : users.length === 0 ? (
        <EmptyState title="No users yet" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-2 font-semibold">Email</th>
                <th className="px-4 py-2 font-semibold">Role</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold">Last login</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {paged.map((u) => (
                <tr key={u.id} className="border-t border-border bg-surface">
                  <td className="px-4 py-2 text-fg">{u.email}</td>
                  <td className="px-4 py-2">
                    <select value={u.role} onChange={(e) => change(u, { role: e.target.value })}
                      className="rounded border border-border bg-bg px-1.5 py-1 text-xs text-fg">
                      <option value="viewer">Viewer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <select value={u.status} onChange={(e) => change(u, { status: e.target.value })}
                      className="rounded border border-border bg-bg px-1.5 py-1 text-xs text-fg">
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 text-muted num">{relativeDate(u.last_login_at)}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => setConfirmDel(u)} className="rounded p-1 text-destructive hover:bg-destructive/10" title="Remove user">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded border border-border px-3 py-1 disabled:opacity-40">Prev</button>
          <span className="text-muted">Page {page + 1} of {pages}</span>
          <button disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)} className="rounded border border-border px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDel}
        title={`Remove ${confirmDel?.email}?`}
        message="They'll lose access until re-invited."
        confirmLabel="Remove" destructive
        onCancel={() => setConfirmDel(null)}
        onConfirm={async () => {
          if (confirmDel) await api.deleteUser(confirmDel.id).catch((e) => setErr(e instanceof ApiError ? e.message : "Delete failed"));
          setConfirmDel(null); load();
        }}
      />
    </div>
  );
}
