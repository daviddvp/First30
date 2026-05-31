"use client";

import { useState } from "react";
import { Card } from "./Card";
import { Button } from "./Button";
import { useToast } from "./ToastProvider";
import { Send } from "lucide-react";
import { formatRelative } from "@/lib/formatters";

export interface NoteItem { id: string; body: string; createdAt: string; }

/** Notas internas del equipo. Optimista: añade la nota al instante y avisa. */
export function InternalNotes({ memberId, initial }: { memberId: string; initial: NoteItem[] }) {
  const toast = useToast();
  const [notes, setNotes] = useState<NoteItem[]>(initial);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    const body = draft.trim();
    if (!body) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/members/${memberId}/notes`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      setNotes((n) => [{ id: json.data.id, body: json.data.body, createdAt: json.data.createdAt }, ...n]);
      setDraft("");
      toast.show("Nota guardada");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "No se pudo guardar la nota", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-[14px] font-bold">Notas internas</h3>
      <div className="flex items-start gap-2">
        <textarea
          value={draft} onChange={(e) => setDraft(e.target.value)}
          rows={2} placeholder="Añade una nota para el equipo…"
          className="flex-1 resize-none rounded-lg border border-border-strong bg-surface px-3 py-2 text-[13px] outline-none focus:border-accent"
        />
        <Button icon={Send} onClick={add}>{busy ? "…" : "Añadir"}</Button>
      </div>
      <ul className="mt-3 space-y-2">
        {notes.length === 0 && <li className="py-3 text-center text-[12.5px] text-faint">Sin notas todavía.</li>}
        {notes.map((n) => (
          <li key={n.id} className="rounded-lg border border-border bg-subtle px-3 py-2">
            <p className="text-[13px]">{n.body}</p>
            <span className="mt-1 block text-[11px] text-faint">{formatRelative(n.createdAt)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
