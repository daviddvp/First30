// ─────────────────────────────────────────────────────────────────────────────
// First30 — Tests del importador CSV (sin base de datos, solo lógica pura)
// Ejecutar con: npx tsx scripts/test-csv-import.ts
// ─────────────────────────────────────────────────────────────────────────────
import { parseCsvString } from "../src/lib/csv/parse-csv";
import { autoMapColumns, applyMappings } from "../src/lib/csv/map-columns";
import { validateRow, normalizeLevel, parseDate } from "../src/lib/csv/validate-member-import";

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) { console.log(`  ✅ ${name}`); passed++; }
  else { console.error(`  ❌ FAILED: ${name}${detail ? ` — ${detail}` : ""}`); failed++; }
}

// ─── Parsing ──────────────────────────────────────────────────────────────────
console.log("\n1. Parsing de CSV");

const simpleCsv = `nombre,email,fecha_alta\nMarta,marta@test.com,2026-01-15\nDavid,david@test.com,2026-01-20`;
const { headers, rows } = parseCsvString(simpleCsv);
assert(headers.length === 3, "Detecta 3 cabeceras");
assert(rows.length === 2, "Lee 2 filas de datos");
assert(rows[0]["nombre"] === "Marta", "Lee el nombre correctamente");

// Filas vacías se ignoran
const csvWithBlanks = `nombre,email\nMarta,marta@x.com\n\n\nDavid,david@x.com`;
const { rows: rows2 } = parseCsvString(csvWithBlanks);
assert(rows2.length === 2, "Ignora filas vacías");

// CSV con comillas
const csvQuoted = `nombre,notas\n"García, Marta","Viene de ""Instagram"""\nDavid,Sin notas`;
const { rows: rows3 } = parseCsvString(csvQuoted);
assert(rows3[0]["nombre"] === "García, Marta", "Soporta comas dentro de comillas");
assert(rows3[0]["notas"] === 'Viene de "Instagram"', "Soporta comillas escapadas");

// ─── Mapping ──────────────────────────────────────────────────────────────────
console.log("\n2. Mapeo de columnas");

const mappings = autoMapColumns(["Nombre", "correo", "fecha_alta", "coach", "nivel", "fuente"]);
const mmap = new Map(mappings.map((m) => [m.csvHeader, m.internalField]));

assert(mmap.get("Nombre") === "fullName", "Mapea 'Nombre' → fullName");
assert(mmap.get("correo") === "email", "Mapea 'correo' → email");
assert(mmap.get("fecha_alta") === "joinDate", "Mapea 'fecha_alta' → joinDate");
assert(mmap.get("coach") === "assignedCoachName", "Mapea 'coach' → assignedCoachName");
assert(mmap.get("nivel") === "level", "Mapea 'nivel' → level");
assert(mmap.get("fuente") === "acquisitionSource", "Mapea 'fuente' → acquisitionSource");

// Inglés
const enMappings = autoMapColumns(["name", "email", "join_date", "level"]);
const enMap = new Map(enMappings.map((m) => [m.csvHeader, m.internalField]));
assert(enMap.get("name") === "fullName", "Mapea 'name' → fullName");
assert(enMap.get("join_date") === "joinDate", "Mapea 'join_date' → joinDate");

// ─── Validación ───────────────────────────────────────────────────────────────
console.log("\n3. Validación de filas");

const emptyCtx = {
  existingByEmail: new Map<string, string>(),
  existingByPhone: new Map<string, string>(),
  existingByNameDate: new Map<string, string>(),
  coachByName: new Map<string, string>(),
};

// Error: nombre vacío
const noName = validateRow({ rowIndex: 2, fullName: "", joinDate: "2026-01-15" }, emptyCtx);
assert(noName.action === "error", "Error si falta nombre");
assert(noName.errors.some((e) => e.includes("nombre")), "Mensaje de error menciona nombre");

// Error: joinDate inválida
const badDate = validateRow({ rowIndex: 3, fullName: "Marta", joinDate: "no-es-fecha" }, emptyCtx);
assert(badDate.action === "error", "Error si joinDate es inválida");

// Warning: sin email ni teléfono
const noContact = validateRow({ rowIndex: 4, fullName: "Marta", joinDate: "2026-01-15" }, emptyCtx);
assert(noContact.warnings.some((w) => w.includes("email")), "Warning si falta email y teléfono");

// Warning: coach no existe
const unknownCoach = validateRow(
  { rowIndex: 5, fullName: "Ana", joinDate: "2026-01-15", assignedCoachName: "Coach Inexistente" },
  emptyCtx,
);
assert(unknownCoach.warnings.some((w) => w.includes("Coach Inexistente")), "Warning si coach no existe");
assert(unknownCoach.assignedCoachId === null, "assignedCoachId es null si coach no encontrado");

// Normalización de nivel
assert(normalizeLevel("principiante") === "beginner", "Normaliza 'principiante' → beginner");
assert(normalizeLevel("Intermedio") === "intermediate", "Normaliza 'Intermedio' → intermediate");
assert(normalizeLevel("advanced") === "advanced", "Normaliza 'advanced' → advanced");
assert(normalizeLevel("avanzado") === "advanced", "Normaliza 'avanzado' → advanced");
assert(normalizeLevel("desconocido") === null, "Nivel desconocido → null");

// Parseo de fechas
assert(parseDate("2026-01-15")?.iso === "2026-01-15", "Parsea YYYY-MM-DD");
assert(parseDate("15/01/2026")?.iso === "2026-01-15", "Parsea DD/MM/YYYY");
assert(parseDate("15-01-2026")?.iso === "2026-01-15", "Parsea DD-MM-YYYY");
assert(parseDate("") === null, "Fecha vacía → null");
assert(parseDate("no-fecha") === null, "Fecha inválida → null");

// ─── Deduplicación ────────────────────────────────────────────────────────────
console.log("\n4. Deduplicación");

const ctxWithData = {
  existingByEmail: new Map([["marta@test.com", "mbr_001"]]),
  existingByPhone: new Map([["600111222", "mbr_002"]]),
  existingByNameDate: new Map([["carlos martín|2026-01-01", "mbr_003"]]),
  coachByName: new Map<string, string>(),
};

// Actualizar por email
const dupEmail = validateRow(
  { rowIndex: 2, fullName: "Marta García", email: "marta@test.com", joinDate: "2026-02-01" },
  ctxWithData,
);
assert(dupEmail.action === "update", "Detecta duplicado por email → update");
assert(dupEmail.existingMemberId === "mbr_001", "Devuelve el ID del socio existente");

// Actualizar por teléfono (sin email)
const dupPhone = validateRow(
  { rowIndex: 3, fullName: "Otro nombre", phone: "600111222", joinDate: "2026-02-01" },
  ctxWithData,
);
assert(dupPhone.action === "update", "Detecta duplicado por teléfono → update");

// Posible duplicado por nombre + fecha
const dupNameDate = validateRow(
  { rowIndex: 4, fullName: "Carlos Martín", joinDate: "2026-01-01" },
  ctxWithData,
);
assert(dupNameDate.action === "duplicate_warning", "Detecta posible duplicado por nombre+fecha");

// Crear si no hay coincidencia
const newMember = validateRow(
  { rowIndex: 5, fullName: "Nuevo Socio", email: "nuevo@test.com", joinDate: "2026-03-01" },
  ctxWithData,
);
assert(newMember.action === "create", "Crea si no hay coincidencia");

// No cruzar orgs (la deduplicación usa los mapas del contexto, que ya son de una sola org)
// Este test valida que si el mapa está vacío para otra org, no encuentra duplicado
const isolatedCtx = {
  existingByEmail: new Map<string, string>(), // sin datos de org A
  existingByPhone: new Map<string, string>(),
  existingByNameDate: new Map<string, string>(),
  coachByName: new Map<string, string>(),
};
const crossOrgCheck = validateRow(
  { rowIndex: 6, fullName: "Marta García", email: "marta@test.com", joinDate: "2026-02-01" },
  isolatedCtx,
);
assert(crossOrgCheck.action === "create", "No detecta duplicado de otra org (contexto aislado)");

// ─── Permisos ─────────────────────────────────────────────────────────────────
console.log("\n5. Permisos");

import { can } from "../src/lib/permissions";

const owner = { id: "u1", organizationId: "org_a", name: "Owner", role: "owner" as const, coachProfileId: null };
const manager = { id: "u2", organizationId: "org_a", name: "Manager", role: "manager" as const, coachProfileId: null };
const coach = { id: "u3", organizationId: "org_a", name: "Coach", role: "coach" as const, coachProfileId: "cph_1" };

assert(can(owner, "member.import"), "Owner puede importar");
assert(can(manager, "member.import"), "Manager puede importar");
assert(!can(coach, "member.import"), "Coach NO puede importar");

// ─── Resumen ──────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Resultado: ${passed} ✅  |  ${failed} ❌`);
if (failed > 0) { console.error(`\n⚠️  ${failed} test(s) fallaron.`); process.exit(1); }
else console.log("\n🎉 Todos los tests CSV pasaron.");
