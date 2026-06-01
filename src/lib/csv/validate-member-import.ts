import type { ValidatedImportRow } from "./member-import-types";
import type { MemberLevel } from "@/types";

// ─── Normalización de nivel ───────────────────────────────────────────────────

const LEVEL_MAP: Record<string, MemberLevel> = {
  principiante: "beginner", beginner: "beginner", inicial: "beginner", basico: "beginner",
  intermedio: "intermediate", intermediate: "intermediate", medio: "intermediate",
  avanzado: "advanced", advanced: "advanced", experto: "advanced",
};

export function normalizeLevel(raw: string | undefined): MemberLevel | null {
  if (!raw) return null;
  const key = raw.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return LEVEL_MAP[key] ?? null;
}

// ─── Normalización de fecha ───────────────────────────────────────────────────

const DATE_FORMATS = [
  // YYYY-MM-DD
  /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
  // DD/MM/YYYY
  /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  // DD-MM-YYYY
  /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
];

export function parseDate(raw: string | undefined): { iso: string; ambiguous: boolean } | null {
  if (!raw) return null;
  const s = raw.trim();

  // YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const d = new Date(`${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`);
    return isNaN(d.getTime()) ? null : { iso: d.toISOString().split("T")[0], ambiguous: false };
  }

  // DD/MM/YYYY o DD-MM-YYYY (europeo)
  const euroMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (euroMatch) {
    const day = parseInt(euroMatch[1], 10);
    const month = parseInt(euroMatch[2], 10);
    const year = parseInt(euroMatch[3], 10);
    const d = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
    // Marcar como ambiguo solo si día y mes ambos son ≤ 12 (podría ser MM/DD/YYYY americano)
    const ambiguous = day <= 12 && month <= 12;
    return isNaN(d.getTime()) ? null : { iso: d.toISOString().split("T")[0], ambiguous };
  }

  return null;
}

// ─── Normalización de email ───────────────────────────────────────────────────

export function normalizeEmail(raw: string | undefined): string | null {
  if (!raw) return null;
  const e = raw.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
}

// ─── Normalización de teléfono ───────────────────────────────────────────────

export function normalizePhone(raw: string | undefined): string | null {
  if (!raw) return null;
  const p = raw.trim().replace(/[\s\-\.]/g, "");
  return p.length >= 6 ? p : null;
}

// ─── Validación principal de fila ────────────────────────────────────────────

export interface RawMappedRow {
  rowIndex: number;
  fullName?: string;
  email?: string;
  phone?: string;
  joinDate?: string;
  mainGoal?: string;
  level?: string;
  assignedCoachName?: string;
  lastAttendanceAt?: string;
  attendanceCount?: string;
  nextClassAt?: string;
  limitations?: string;
  acquisitionSource?: string;
  notes?: string;
}

interface ValidationContext {
  existingByEmail: Map<string, string>;   // email → memberId
  existingByPhone: Map<string, string>;   // phone → memberId
  existingByNameDate: Map<string, string>; // fullName+joinDate → memberId
  coachByName: Map<string, string>;       // lowerName → coachId
}

export function validateRow(
  raw: RawMappedRow,
  ctx: ValidationContext,
): ValidatedImportRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ── fullName (obligatorio) ────────────────────────────────────────────────
  const fullName = raw.fullName?.trim() ?? "";
  if (!fullName) errors.push("El nombre es obligatorio");

  // ── joinDate (obligatorio) ────────────────────────────────────────────────
  const joinDateResult = parseDate(raw.joinDate);
  if (!raw.joinDate) {
    errors.push("La fecha de alta es obligatoria");
  } else if (!joinDateResult) {
    errors.push(`Fecha de alta inválida: "${raw.joinDate}" (usa YYYY-MM-DD o DD/MM/YYYY)`);
  } else if (joinDateResult.ambiguous) {
    warnings.push("La fecha podría ser ambigua. Se interpretó como DD/MM/YYYY (europeo).");
  }

  // ── email ─────────────────────────────────────────────────────────────────
  const email = normalizeEmail(raw.email);
  if (raw.email && !email) {
    errors.push(`Email inválido: "${raw.email}"`);
  }

  // ── phone ─────────────────────────────────────────────────────────────────
  const phone = normalizePhone(raw.phone);
  if (!email && !phone) {
    warnings.push("Sin email ni teléfono. Será difícil contactar al socio.");
  }

  // ── level ─────────────────────────────────────────────────────────────────
  const level = normalizeLevel(raw.level) ?? "beginner";
  if (raw.level && !normalizeLevel(raw.level)) {
    warnings.push(`Nivel no reconocido: "${raw.level}". Se asignará "principiante".`);
  }

  // ── lastAttendanceAt ──────────────────────────────────────────────────────
  let lastAttendanceAt: string | null = null;
  if (raw.lastAttendanceAt) {
    const r = parseDate(raw.lastAttendanceAt);
    if (r) lastAttendanceAt = r.iso;
    else warnings.push(`Fecha de última asistencia inválida: "${raw.lastAttendanceAt}". Se ignorará.`);
  } else {
    warnings.push("Sin última asistencia registrada.");
  }

  // ── attendanceCount ───────────────────────────────────────────────────────
  let attendanceCount: number | null = null;
  if (raw.attendanceCount !== undefined && raw.attendanceCount !== "") {
    const n = parseInt(raw.attendanceCount, 10);
    if (isNaN(n)) errors.push(`Número de asistencias no válido: "${raw.attendanceCount}"`);
    else attendanceCount = n;
  }

  // ── nextClassAt ───────────────────────────────────────────────────────────
  let nextClassAt: string | null = null;
  if (raw.nextClassAt) {
    const r = parseDate(raw.nextClassAt);
    if (r) nextClassAt = r.iso;
    else warnings.push(`Fecha de próxima clase inválida: "${raw.nextClassAt}". Se ignorará.`);
  }

  // ── assignedCoachId ───────────────────────────────────────────────────────
  let assignedCoachId: string | null = null;
  const assignedCoachName = raw.assignedCoachName?.trim() ?? null;
  if (assignedCoachName) {
    const coachId = ctx.coachByName.get(assignedCoachName.toLowerCase());
    if (coachId) {
      assignedCoachId = coachId;
    } else {
      warnings.push(`Coach "${assignedCoachName}" no encontrado. El socio quedará sin coach asignado.`);
    }
  } else {
    warnings.push("Sin coach asignado.");
  }

  // ── Deduplicación ─────────────────────────────────────────────────────────
  let action: ValidatedImportRow["action"] = errors.length > 0 ? "error" : "create";
  let existingMemberId: string | undefined;

  if (errors.length === 0) {
    if (email && ctx.existingByEmail.has(email)) {
      action = "update";
      existingMemberId = ctx.existingByEmail.get(email);
    } else if (phone && ctx.existingByPhone.has(phone)) {
      action = "update";
      existingMemberId = ctx.existingByPhone.get(phone);
    } else if (fullName && joinDateResult) {
      const key = `${fullName.toLowerCase()}|${joinDateResult.iso}`;
      if (ctx.existingByNameDate.has(key)) {
        action = "duplicate_warning";
        existingMemberId = ctx.existingByNameDate.get(key);
      }
    }
  }

  return {
    rowIndex: raw.rowIndex,
    action,
    existingMemberId,
    fullName,
    email,
    phone,
    joinDate: joinDateResult?.iso ?? "",
    mainGoal: raw.mainGoal?.trim() || null,
    level,
    assignedCoachId,
    assignedCoachName,
    lastAttendanceAt,
    attendanceCount,
    nextClassAt,
    limitations: raw.limitations?.trim() || null,
    acquisitionSource: raw.acquisitionSource?.trim() || null,
    notes: raw.notes?.trim() || null,
    errors,
    warnings,
  };
}
