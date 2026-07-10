import { useState } from "react";
import { Link, NavLink, useMatch, useNavigate } from "react-router-dom";
import { Layers, LogOut, Map, ChevronLeft, UserCog, Building2, Library } from "lucide-react";
import { useAuth } from "../lib/auth";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

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

        {/* ── primary nav: the office view + the documentation directory ── */}
        <nav className="ml-1 hidden items-center gap-0.5 md:flex">
          {tab("/", "Divisions", Building2)}
          {tab("/docs", "Documentation", Library)}
        </nav>

        {/* ── inside a project: its own sub-tabs ── */}
        {slug && (
          <nav className="ml-1 hidden items-center gap-1 border-l border-border pl-2 lg:flex">
            <Link to="/" className="mr-1 inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
              <ChevronLeft className="h-3.5 w-3.5" /> All
            </Link>
            {tab(`/floor/${slug}`, "Roadmap", Map)}
          </nav>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <NotificationBell />
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
                    <UserCog className="h-4 w-4" /> Admin dashboard
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
