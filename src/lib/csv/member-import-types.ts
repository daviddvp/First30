import type { MemberLevel } from "@/types";

// ─── Campos internos que acepta el importador ────────────────────────────────

export const INTERNAL_FIELDS = [
  "fullName",
  "email",
  "phone",
  "joinDate",
  "mainGoal",
  "level",
  "assignedCoachName",
  "lastAttendanceAt",
  "attendanceCount",
  "nextClassAt",
  "limitations",
  "acquisitionSource",
  "notes",
] as const;

export type InternalField = typeof INTERNAL_FIELDS[number];

// ─── Mapeo de columna CSV a campo interno ────────────────────────────────────

export interface ColumnMapping {
  csvHeader: string;
  internalField: InternalField | null; // null = ignorar
}

// ─── Fila en bruto desde el CSV ──────────────────────────────────────────────

export type RawCsvRow = Record<string, string>;

// ─── Estado de cada fila en la preview ───────────────────────────────────────

export type ImportRowAction = "create" | "update" | "duplicate_warning" | "error" | "skipped";

// ─── Fila validada y lista para importar ─────────────────────────────────────

export interface ValidatedImportRow {
  rowIndex: number;
  action: ImportRowAction;
  existingMemberId?: string;
  // Campos normalizados
  fullName: string;
  email: string | null;
  phone: string | null;
  joinDate: string; // ISO
  mainGoal: string | null;
  level: MemberLevel;
  assignedCoachId: string | null;
  assignedCoachName: string | null;
  lastAttendanceAt: string | null; // ISO
  attendanceCount: number | null;
  nextClassAt: string | null; // ISO
  limitations: string | null;
  acquisitionSource: string | null;
  notes: string | null;
  // Diagnóstico
  errors: string[];
  warnings: string[];
}

// ─── Respuesta del endpoint de preview ───────────────────────────────────────

export interface ImportPreviewResponse {
  summary: {
    totalRows: number;
    validRows: number;
    rowsWithWarnings: number;
    rowsWithErrors: number;
    createCount: number;
    updateCount: number;
    possibleDuplicatesCount: number;
    ignoredCount: number;
  };
  mappings: ColumnMapping[];
  rows: ValidatedImportRow[];
}

// ─── Respuesta del endpoint de confirmación ──────────────────────────────────

export interface ImportConfirmResponse {
  created: number;
  updated: number;
  ignored: number;
  alertsCreated: number;
  tasksCreated: number;
  auditLogId?: string;
}
