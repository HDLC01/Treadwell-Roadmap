import { Navigate, Route, Routes } from "react-router-dom";
import TopBar from "./components/TopBar";
import { RequireAdmin, RequireAuth } from "./lib/auth";
import LoginPage from "./pages/LoginPage";
import OverviewPage from "./pages/OverviewPage";
import SystemRoadmapPage from "./pages/SystemRoadmapPage";
import DocsPage from "./pages/DocsPage";
import AdminUsersPage from "./pages/AdminUsersPage";

function Layout({ children, fullBleed, wide }: { children: React.ReactNode; fullBleed?: boolean; wide?: boolean }) {
  // fullBleed pins to the viewport (for fixed-height canvases); everything else
  // scrolls the document naturally — the most reliable scroll behavior.
  // `wide` stretches to the full browser width (the virtual office floor plan).
  if (fullBleed) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-bg">
        <TopBar />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    );
  }
  return (
    <div className="min-h-dvh bg-bg">
      <TopBar />
      <main className={wide ? "w-full px-4 py-6 sm:px-6 lg:px-8" : "mx-auto w-full max-w-6xl px-4 py-6"}>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={<RequireAuth><Layout fullBleed><OverviewPage /></Layout></RequireAuth>}
      />
      <Route
        path="/floor/:slug"
        element={<RequireAuth><Layout fullBleed><SystemRoadmapPage /></Layout></RequireAuth>}
      />
      <Route
        path="/floor/:slug/sop"
        element={<RequireAuth><Layout><DocsPage kind="sop" /></Layout></RequireAuth>}
      />
      <Route
        path="/floor/:slug/docs"
        element={<RequireAuth><Layout><DocsPage kind="dev_doc" /></Layout></RequireAuth>}
      />
      <Route
        path="/admin/users"
        element={<RequireAuth><Layout><RequireAdmin><AdminUsersPage /></RequireAdmin></Layout></RequireAuth>}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
