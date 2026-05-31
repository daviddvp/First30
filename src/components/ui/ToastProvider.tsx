"use client";

import { createContext, useContext, useCallback, useState } from "react";
import { Check, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface Toast { id: number; kind: ToastKind; message: string; }
interface ToastApi { show: (message: string, kind?: ToastKind) => void; }

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}

const ICON = { success: Check, error: AlertCircle, info: Info };
const STYLE: Record<ToastKind, string> = {
  success: "border-accent/30 bg-accent-soft text-accent-strong",
  error: "border-danger/30 bg-danger-soft text-danger-strong",
  info: "border-border-strong bg-surface text-ink",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[320px] flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICON[t.kind];
          return (
            <div key={t.id}
              className={cn("toast-in pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 shadow-lift", STYLE[t.kind])}>
              <Icon size={16} strokeWidth={2.4} className="mt-0.5 shrink-0" />
              <span className="flex-1 text-[13px] font-medium leading-snug">{t.message}</span>
              <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100"><X size={14} /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
