import { useEffect, useState } from "react";
import { X } from "lucide-react";

// Roadmap-styled replacement for window.prompt() — a centered pop-up that asks
// for a single text value (e.g. a new feature name or version label).
export default function PromptModal({
  open, title, label, placeholder, confirmLabel = "Add", onSubmit, onClose,
}: {
  open: boolean;
  title: string;
  label: string;
  placeholder?: string;
  confirmLabel?: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");

  useEffect(() => { if (open) setValue(""); }, [open]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;
  const submit = () => { const v = value.trim(); if (v) { onSubmit(v); onClose(); } };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-base font-bold text-fg">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
            {label}
            <input
              autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-fg hover:bg-surface-2">Cancel</button>
          <button onClick={submit} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
