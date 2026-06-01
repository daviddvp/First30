"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Upload, Download, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onFileReady: (text: string, fileName: string) => void;
  loading?: boolean;
}

export function CsvUploadStep({ onFileReady, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!file.name.endsWith(".csv") && file.type !== "text/csv" && file.type !== "text/plain") {
      setError("El archivo debe ser .csv o .txt");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo es demasiado grande (máximo 5 MB)");
      return;
    }
    const text = await file.text();
    if (!text.trim()) {
      setError("El archivo está vacío");
      return;
    }
    onFileReady(text, file.name);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-4">
      {/* Zona de drop */}
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition",
          dragging ? "border-accent bg-accent-soft" : "border-border hover:border-accent",
        )}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
          <Upload size={22} />
        </div>
        <p className="text-[14px] font-semibold text-ink">
          {dragging ? "Suelta el archivo aquí" : "Arrastra tu CSV aquí, o haz clic para buscar"}
        </p>
        <p className="mt-1 text-[12.5px] text-muted">Formatos aceptados: .csv · Máximo 5 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv,text/plain"
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-danger-soft bg-danger-soft px-3 py-2.5 text-[13px] text-danger-strong">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {/* Info y plantilla */}
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <FileText size={18} className="mt-0.5 shrink-0 text-accent-strong" />
          <div className="flex-1">
            <p className="text-[13px] leading-relaxed text-muted">
              Sube un CSV con los nuevos socios del box. First30 analizará los datos, detectará posibles riesgos y preparará tareas sugeridas.{" "}
              <strong className="text-ink">No se enviará ningún mensaje automáticamente.</strong>
            </p>
            <div className="mt-3">
              <a
                href="/api/imports/members/template"
                download="first30-socios-plantilla.csv"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-accent-strong hover:underline"
              >
                <Download size={13} />
                Descargar plantilla CSV
              </a>
            </div>
          </div>
        </div>
      </Card>

      <p className="text-center text-[12px] text-faint">
        ¿Tienes los datos en otro formato? Puedes exportar desde Excel, Google Sheets o tu software de gestión.
      </p>
    </div>
  );
}
