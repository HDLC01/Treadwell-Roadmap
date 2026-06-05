import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = "Confirm",
  destructive, busy, onConfirm, onCancel,
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-fg">{title}</h2>
        {message && <p className="mt-1.5 text-sm text-muted">{message}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-fg hover:bg-surface-2 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            ref={ref}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: destructive ? "var(--destructive)" : "var(--accent)" }}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
