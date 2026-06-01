import type { ColumnMapping, InternalField } from "./member-import-types";
import { INTERNAL_FIELDS } from "./member-import-types";

// ─── Tabla de sinónimos por campo interno ────────────────────────────────────

const SYNONYMS: Record<InternalField, string[]> = {
  fullName:         ["fullname", "nombre", "name", "full_name", "socio", "nombre_completo", "nombre completo"],
  email:            ["email", "correo", "e-mail", "mail", "correo_electronico"],
  phone:            ["phone", "telefono", "teléfono", "tel", "movil", "móvil", "celular"],
  joinDate:         ["joindate", "join_date", "fecha_alta", "fecha alta", "alta", "fecha_incorporacion", "incorporacion"],
  mainGoal:         ["maingoal", "main_goal", "objetivo", "goal", "meta"],
  level:            ["level", "nivel", "experiencia", "expertise"],
  assignedCoachName:["assignedcoachname", "coach", "entrenador", "instructor", "assigned_coach", "assigned coach"],
  lastAttendanceAt: ["lastattendanceat", "last_attendance", "ultima_asistencia", "última asistencia", "ultima asistencia", "last_visit"],
  attendanceCount:  ["attendancecount", "attendance_count", "asistencias", "num_asistencias", "visitas"],
  nextClassAt:      ["nextclassat", "next_class", "proxima_clase", "próxima clase", "proxima clase", "next_visit"],
  limitations:      ["limitations", "limitaciones", "lesiones", "injuries", "restricciones"],
  acquisitionSource:["acquisitionsource", "acquisition_source", "fuente", "source", "origen", "captacion"],
  notes:            ["notes", "notas", "observaciones", "comments", "comentarios"],
};

/**
 * Genera el automapeo de columnas CSV a campos internos.
 * Normaliza la cabecera CSV (lowercase, sin espacios extra)
 * y la compara con la lista de sinónimos de cada campo.
 */
export function autoMapColumns(csvHeaders: string[]): ColumnMapping[] {
  return csvHeaders.map((header) => {
    const normalized = header.toLowerCase().trim().replace(/\s+/g, "_");
    const match = findMatch(normalized);
    return { csvHeader: header, internalField: match };
  });
}

function findMatch(normalized: string): InternalField | null {
  for (const field of INTERNAL_FIELDS) {
    const synonyms = SYNONYMS[field];
    if (
      synonyms.some(
        (s) => s === normalized || s.replace(/\s+/g, "_") === normalized
      )
    ) {
      return field;
    }
  }
  return null;
}

/** Aplica el mapeo a una fila raw y devuelve un objeto con claves internas. */
export function applyMappings(
  row: Record<string, string>,
  mappings: ColumnMapping[],
): Partial<Record<InternalField, string>> {
  const result: Partial<Record<InternalField, string>> = {};
  for (const m of mappings) {
    if (m.internalField && m.csvHeader in row) {
      const val = row[m.csvHeader]?.trim() ?? "";
      if (val !== "") {
        result[m.internalField] = val;
      }
    }
  }
  return result;
}

/** Devuelve los campos internos que no tienen ninguna columna mapeada. */
export function unmappedRequiredFields(mappings: ColumnMapping[]): InternalField[] {
  const mapped = new Set(mappings.map((m) => m.internalField).filter(Boolean));
  const required: InternalField[] = ["fullName", "joinDate"];
  return required.filter((f) => !mapped.has(f));
}
