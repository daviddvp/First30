"use client";

import { useState } from "react";
import { CsvUploadStep } from "./CsvUploadStep";
import { ColumnMappingStep } from "./ColumnMappingStep";
import { ImportPreviewStep } from "./ImportPreviewStep";
import { ImportResultStep } from "./ImportResultStep";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";
import type {
  ImportPreviewResponse,
  ImportConfirmResponse,
  ColumnMapping,
  ValidatedImportRow,
} from "@/lib/csv/member-import-types";

type Step = "upload" | "mapping" | "preview" | "result";

const STEPS: { id: Step; label: string }[] = [
  { id: "upload",  label: "Subir archivo" },
  { id: "mapping", label: "Mapear columnas" },
  { id: "preview", label: "Revisar y confirmar" },
  { id: "result",  label: "Resultado" },
];

export function MemberCsvImporter() {
  const toast = useToast();
  const [step, setStep] = useState<Step>("upload");
  const [loading, setLoading] = useState(false);

  // Estado entre pasos
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("import.csv");
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [result, setResult] = useState<ImportConfirmResponse | null>(null);

  // ── Paso 1 → 2: subir archivo y obtener preview inicial ──────────────────
  async function handleFileReady(text: string, name: string) {
    setCsvText(text);
    setFileName(name);
    setLoading(true);
    try {
      const res = await fetch("/api/imports/members/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: text, fileName: name }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error?.message ?? "Error al analizar el CSV");
      setMappings(json.data.mappings);
      setPreview(json.data);
      setStep("mapping");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Error al leer el archivo", "error");
    } finally {
      setLoading(false);
    }
  }

  // ── Paso 2 → 3: re-ejecutar preview con mapeo actualizado ────────────────
  async function handleMappingConfirm(newMappings: ColumnMapping[]) {
    setMappings(newMappings);
    setLoading(true);
    try {
      const res = await fetch("/api/imports/members/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText, fileName, mappings: newMappings }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error?.message ?? "Error al analizar el CSV");
      setPreview(json.data);
      setStep("preview");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Error al procesar el CSV", "error");
    } finally {
      setLoading(false);
    }
  }

  // ── Paso 3 → 4: confirmar importación ───────────────────────────────────
  async function handleConfirm(rows: ValidatedImportRow[]) {
    setLoading(true);
    try {
      const res = await fetch("/api/imports/members/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, fileName }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error?.message ?? "Error al importar");
      setResult(json.data);
      setStep("result");
      toast.show(
        `Importación completada: ${json.data.created} creados, ${json.data.updated} actualizados`,
        "success",
      );
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "Error al importar socios", "error");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("upload");
    setCsvText("");
    setFileName("import.csv");
    setMappings([]);
    setPreview(null);
    setResult(null);
  }

  const currentStepIdx = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="space-y-6">
      {/* Indicador de pasos */}
      <nav className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const isDone = i < currentStepIdx;
          const isCurrent = s.id === step;
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition",
                isCurrent ? "bg-accent text-white"
                  : isDone ? "bg-accent-soft text-accent-strong"
                    : "bg-subtle-2 text-faint",
              )}>
                {isDone ? "✓" : i + 1}
              </div>
              <span className={cn("text-[12.5px] font-medium hidden sm:block",
                isCurrent ? "text-ink" : isDone ? "text-accent-strong" : "text-faint"
              )}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && <div className="mx-1 h-px w-6 bg-border" />}
            </div>
          );
        })}
      </nav>

      {/* Contenido del paso actual */}
      {step === "upload" && (
        <CsvUploadStep onFileReady={handleFileReady} loading={loading} />
      )}
      {step === "mapping" && preview && (
        <ColumnMappingStep
          mappings={mappings}
          fileName={fileName}
          onConfirm={handleMappingConfirm}
          loading={loading}
        />
      )}
      {step === "preview" && preview && (
        <ImportPreviewStep
          preview={preview}
          fileName={fileName}
          onConfirm={handleConfirm}
          onBack={() => setStep("mapping")}
          loading={loading}
        />
      )}
      {step === "result" && result && (
        <ImportResultStep result={result} onImportAnother={reset} />
      )}
    </div>
  );
}
