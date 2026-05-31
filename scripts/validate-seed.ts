import { db } from "../src/data/seed";
import { orgScope, listOrganizations } from "../src/data/mock-db";

let fail = 0;
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "✓" : "✗"} ${label}${extra ? ` — ${extra}` : ""}`);
  if (!cond) fail++;
};

// --- Conteos pedidos ---
ok("2 organizaciones", db.organizations.length === 2, `${db.organizations.length}`);
ok("3 roles distintos", new Set(db.users.map(u => u.role)).size === 3);
ok("6 coaches", db.coachProfiles.length === 6, `${db.coachProfiles.length}`);
ok("20 socios", db.members.length === 20, `${db.members.length}`);
ok("≥40 asistencias", db.attendances.length >= 40, `${db.attendances.length}`);
ok("30 tareas", db.tasks.length === 30, `${db.tasks.length}`);
ok("12 alertas", db.alerts.length === 12, `${db.alerts.length}`);
ok("12 plantillas", db.messageTemplates.length === 12, `${db.messageTemplates.length}`);
ok("2 informes semanales", db.weeklyReports.length === 2, `${db.weeklyReports.length}`);
ok("20 audit logs", db.auditLogs.length === 20, `${db.auditLogs.length}`);

// --- Reglas de coherencia ---
ok("no_coach => assignedCoachId null",
  db.members.filter(m => m.status === "no_coach").every(m => m.assignedCoachId === null));
ok("tarea completada => completedAt presente",
  db.tasks.filter(t => t.status === "completed").every(t => !!t.completedAt));
ok("tarea no completada => completedAt null",
  db.tasks.filter(t => t.status !== "completed").every(t => t.completedAt === null));
ok("alerta resuelta => resolvedAt presente",
  db.alerts.filter(a => a.status === "resolved").every(a => !!a.resolvedAt));
ok("alerta no resuelta => resolvedAt null",
  db.alerts.filter(a => a.status !== "resolved").every(a => a.resolvedAt === null));

// Marta: riesgo alto por no volver, reflejado en 1 sola asistencia y gap grande
const marta = db.members.find(m => m.id === "mbr_marta")!;
const martaAtts = db.attendances.filter(a => a.memberId === "mbr_marta");
ok("Marta riesgo alto + 1 asistencia + sin volver",
  marta.riskLevel === "high" && martaAtts.length === 1 && !!marta.lastAttendanceAt);

// Día 30 => historial suficiente (>=6 asistencias)
ok("socios día 30 con historial suficiente",
  db.members.filter(m => m.onboardingDay >= 30).every(m =>
    db.attendances.filter(a => a.memberId === m.id).length >= 6));

// Todas las entidades con organizationId válido
const orgIds = new Set(db.organizations.map(o => o.id));
const scoped = [db.users, db.coachProfiles, db.members, db.attendances, db.checkIns,
  db.tasks, db.alerts, db.messageTemplates, db.messageLogs, db.onboardingRules,
  db.weeklyReports, db.auditLogs];
ok("toda entidad tiene organizationId válido",
  scoped.every(rows => rows.every((r: any) => orgIds.has(r.organizationId))));

// No mezclar datos: el coach de cada socio pertenece a su misma org
ok("assignedCoachId del mismo tenant",
  db.members.every(m => {
    if (!m.assignedCoachId) return true;
    const cp = db.coachProfiles.find(c => c.id === m.assignedCoachId);
    return cp && cp.organizationId === m.organizationId;
  }));

// FKs de tareas: assignedToUserId existe y misma org
ok("tareas: assignee válido y mismo tenant",
  db.tasks.every(t => {
    const u = db.users.find(u => u.id === t.assignedToUserId);
    return u && u.organizationId === t.organizationId;
  }));

// Plantilla sugerida de alerta existe y es del mismo tenant
ok("alertas: suggestedMessage válido y mismo tenant",
  db.alerts.every(a => {
    if (!a.suggestedMessage) return true;
    const tpl = db.messageTemplates.find(t => t.id === a.suggestedMessage);
    return tpl && tpl.organizationId === a.organizationId;
  }));

// --- orgScope aísla correctamente ---
const a = orgScope("org_centro");
const b = orgScope("org_norte");
ok("orgScope(A) no ve socios de B",
  a.members().every(m => m.organizationId === "org_centro"));
ok("orgScope A=14 / B=6 socios",
  a.members().length === 14 && b.members().length === 6,
  `${a.members().length}/${b.members().length}`);
ok("5 socios obligatorios presentes en A",
  ["mbr_marta","mbr_david","mbr_laura","mbr_carlos","mbr_ana"].every(id => !!a.member(id)));
ok("coachLoad devuelve 0–1",
  a.coachProfiles().every(c => { const l = a.coachLoad(c.id); return l >= 0 && l <= 1; }));

console.log(listOrganizations().map(o =>
  `  · ${o.name}: ${orgScope(o.id).members().length} socios, ${orgScope(o.id).openAlerts().length} alertas abiertas`).join("\n"));

console.log(fail === 0 ? "\nTODO OK ✅" : `\n${fail} comprobación(es) fallida(s) ❌`);
process.exit(fail === 0 ? 0 : 1);
