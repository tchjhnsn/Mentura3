"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { undoFromDashboard, type Done } from "./actions";

// The dashboard's toast: one line after a tap says what happened, with Undo when the change can be undone (its id in
// the change log). Without the provider (Home, for one) the hook does nothing, so shared cards can call it anywhere.

type Toast = { id: number; text: string; changeId: string | null; error?: boolean };
const ToastContext = createContext<(t: Omit<Toast, "id">) => void>(() => {});

/** Show a tap's result: its line, or its error. */
export function useDashToast() {
  const show = useContext(ToastContext);
  return useCallback((d: Done) => show(d.ok ? { text: d.text, changeId: d.changeId } : { text: d.error, changeId: null, error: true }), [show]);
}

export function DashToaster({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [busy, start] = useTransition();
  const seq = useRef(0);
  const show = useCallback((t: Omit<Toast, "id">) => setToast({ ...t, id: ++seq.current }), []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast((t) => (t?.id === toast.id ? null : t)), toast.changeId ? 8000 : 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  const undo = (changeId: string) => start(async () => {
    const r = await undoFromDashboard(changeId);
    show(r.ok ? { text: r.text, changeId: null } : { text: r.error, changeId: null, error: true });
  });
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
        {toast ? (
          <div role="status" className="bg-popover text-popover-foreground pointer-events-auto flex max-w-md min-w-0 items-center gap-2 rounded-full border py-1.5 pr-1.5 pl-4 text-sm shadow-lg">
            <span className={toast.error ? "text-destructive min-w-0 truncate" : "min-w-0 truncate"}>{toast.text}</span>
            {toast.changeId ? <Button variant="ghost" size="sm" className="rounded-full font-semibold" disabled={busy} onClick={() => undo(toast.changeId!)}>Undo</Button> : null}
            <Button variant="ghost" size="icon" className="size-7 rounded-full" aria-label="Close" onClick={() => setToast(null)}><XIcon /></Button>
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
