import { useEffect, useState } from "react";
import { Link, NavLink, useMatch, useNavigate } from "react-router-dom";
import { Layers, LogOut, Map, FileText, BookOpen, ChevronLeft, ChevronDown, UserCog, Building2, Briefcase } from "lucide-react";
import { useAuth } from "../lib/auth";
import { getSystems } from "../lib/api";
import type { SystemSummary } from "../lib/types";
import ThemeToggle from "./ThemeToggle";

export default function TopBar() {
  const { user, isAdmin, logout } = useAuth();
  const nav = useNavigate();
  // Call BOTH hooks unconditionally — `||` would short-circuit the second
  // useMatch and change the hook count between routes (React error #311).
  const onFloorSub = useMatch("/floor/:slug/*");
  const onFloorExact = useMatch("/floor/:slug");
  const onFloor = onFloorSub ?? onFloorExact;
  const slug = onFloor?.params?.slug;
  const [menu, setMenu] = useState(false);
  const [divMenu, setDivMenu] = useState(false);
  const [systems, setSystems] = useState<SystemSummary[]>([]);

  // Pull the office directory so the nav can link straight to any project.
  useEffect(() => {
    let cancelled = false;
    getSystems().then((r) => { if (!cancelled) setSystems(r.systems); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const projects = systems.filter((s) => s.kind === "system");
  const divisions = systems.filter((s) => s.kind === "division");

  const tab = (to: string, label: string, Icon: typeof Map) => (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
          isActive ? "bg-surface-2 text-fg" : "text-muted hover:text-fg"
        }`
      }
    >
      <Icon className="h-4 w-4" /> {label}
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1700px] items-center gap-2 px-4 sm:px-6">
        <Link to="/" className="inline-flex shrink-0 items-center gap-2 font-bold tracking-tight text-fg">
          <Layers className="h-5 w-5 text-accent" />
          <span className="hidden sm:inline">Treadwell Systems</span>
        </Link>

        {/* ── primary nav — always present, including the main office page ── */}
        <nav className="ml-1 hidden items-center gap-0.5 md:flex">
          {tab("/", "Office", Building2)}
          {projects.map((p) => tab(`/floor/${p.slug}`, p.name.split(" — ")[0].split(" (")[0], Map))}
          {divisions.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setDivMenu((m) => !m)}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition-colors hover:text-fg"
              >
                <Briefcase className="h-4 w-4" /> Divisions <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {divMenu && (
                <div
                  className="absolute left-0 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
                  onMouseLeave={() => setDivMenu(false)}
                >
                  {divisions.map((d) => (
                    <button
                      key={d.id}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg hover:bg-surface-2"
                      onClick={() => { setDivMenu(false); nav(`/floor/${d.slug}`); }}
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.accent || "var(--muted)" }} />
                      <span className="truncate">{d.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* ── inside a project: its own sub-tabs ── */}
        {slug && (
          <nav className="ml-1 hidden items-center gap-1 border-l border-border pl-2 lg:flex">
            <Link to="/" className="mr-1 inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
              <ChevronLeft className="h-3.5 w-3.5" /> All
            </Link>
            {tab(`/floor/${slug}`, "Roadmap", Map)}
            {tab(`/floor/${slug}/sop`, "How-To", FileText)}
            {tab(`/floor/${slug}/docs`, "Docs", BookOpen)}
          </nav>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 text-sm text-fg hover:bg-surface-2"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs font-bold text-accent-fg">
                {(user?.email?.[0] || "?").toUpperCase()}
              </span>
              <span className="hidden max-w-[12ch] truncate sm:inline">{user?.email}</span>
            </button>
            {menu && (
              <div
                className="absolute right-0 mt-1 w-52 overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
                onMouseLeave={() => setMenu(false)}
              >
                <div className="border-b border-border px-3 py-2 text-xs text-muted">
                  {user?.email}
                  <span className="ml-1 rounded bg-surface-2 px-1 py-0.5 font-semibold uppercase">{user?.role}</span>
                </div>
                {isAdmin && (
                  <button
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg hover:bg-surface-2"
                    onClick={() => { setMenu(false); nav("/admin/users"); }}
                  >
                    <UserCog className="h-4 w-4" /> Manage users
                  </button>
                )}
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg hover:bg-surface-2"
                  onClick={async () => { setMenu(false); await logout(); nav("/login"); }}
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
