"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/ToastProvider";
import { Copy, Check } from "lucide-react";

/** Bloque de resumen copiable (dirección / coaches). */
export function ReportSummaryBlock({ title, badge, text }: { title: string; badge: string; text: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  function copy() {
    try { navigator.clipboard?.writeText(text); } catch { /* noop */ }
    setCopied(true);
    toast.show(`${title} copiado`);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-bold">{title}</h3>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10.5px] font-semibold text-accent-strong">{badge}</span>
        </div>
        <Button variant={copied ? "soft" : "ghost"} icon={copied ? Check : Copy} onClick={copy}>
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <p className="text-[13.5px] leading-relaxed text-ink">{text}</p>
    </Card>
  );
}
