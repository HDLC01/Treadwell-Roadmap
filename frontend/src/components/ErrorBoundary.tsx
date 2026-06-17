import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // The roadmap renders @xyflow/react + Three.js scenes that can throw on
    // bad data; log so a blank screen has a trail in the console.
    console.error("Roadmap render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-6 text-center">
        <p className="text-base font-semibold text-fg">Something went wrong.</p>
        <p className="mt-1.5 max-w-sm text-sm text-muted">
          The view hit an unexpected error. Reloading usually clears it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 rounded-lg px-3 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--accent)" }}
        >
          Reload
        </button>
      </div>
    );
  }
}
