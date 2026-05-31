/* Tests de RBAC + multi-tenant. Ejecutar: npx tsx scripts/test-permissions.ts
   Cubre los 8 escenarios pedidos usando los servicios con RequestContext. */
import { contextForUser } from "../src/lib/auth";
import { can } from "../src/lib/permissions";
import { memberService } from "../src/server/services/member.service";
import { taskService } from "../src/server/services/task.service";
import { alertService } from "../src/server/services/alert.service";
import { settingsService } from "../src/server/services/settings.service";
import { AppError } from "../src/lib/errors";
import { orgScope } from "../src/data/mock-db";

let fail = 0;
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "\u2713" : "\u2717"} ${label}${extra ? ` \u2014 ${extra}` : ""}`);
  if (!cond) fail++;
};
function expectForbidden(label: string, fn: () => unknown, code = "FORBIDDEN") {
  try { fn(); ok(label, false, "no lanzó error"); }
  catch (e) { ok(label, e instanceof AppError && e.code === code, e instanceof AppError ? e.code : "no AppError"); }
}

// Contextos. Org A: owner, manager, coach1 (cph_a1), coach2 (cph_a2). Org B: owner.
const owner = contextForUser("usr_a_owner");
const manager = contextForUser("usr_a_mgr");
const coach1 = contextForUser("usr_a_c1"); // cph_a1
const coach2 = contextForUser("usr_a_c2"); // cph_a2
const ownerB = contextForUser("usr_b_owner");

// Sanity: a qué coach pertenece cada socio en A
const aMembers = orgScope("org_centro").members();
const coach1Members = aMembers.filter((m) => m.assignedCoachId === "cph_a1").map((m) => m.id);
const coach2Members = aMembers.filter((m) => m.assignedCoachId === "cph_a2").map((m) => m.id);

console.log("== Visibilidad de socios por rol ==");
// 4. Owner ve todos los socios de su organización
ok("Owner ve todos los socios de su org (14)", memberService.list(owner, {}).length === 14, `${memberService.list(owner, {}).length}`);
ok("Manager ve todos los socios de su org (14)", memberService.list(manager, {}).length === 14);
// Coach solo ve los suyos
const coach1Visible = memberService.list(coach1, {}).map((m) => m.id);
ok("Coach1 solo ve sus socios", coach1Visible.length === coach1Members.length && coach1Visible.every((id) => coach1Members.includes(id)), `${coach1Visible.length}`);

console.log("== 1. Coach no ve socio de OTRO coach ==");
const otherCoachMember = coach2Members[0]; // socio de cph_a2
expectForbidden("Coach1 NO puede leer socio de cph_a2", () => memberService.get(coach1, otherCoachMember), "FORBIDDEN");

console.log("== 2. Coach no ve socio de OTRA organización ==");
// Marta (org A) vista por un coach de org B -> ese coach no existe en A; usamos ownerB para confirmar aislamiento por org
expectForbidden("Owner B NO puede leer socio de org A", () => memberService.get(ownerB, "mbr_marta"), "NOT_FOUND");

console.log("== 3. Manager no accede a OTRA organización ==");
// Manager A pide socio que solo existe en B
const bMemberId = orgScope("org_norte").members()[0].id;
expectForbidden("Manager A NO puede leer socio de org B", () => memberService.get(manager, bMemberId), "NOT_FOUND");
ok("Manager A no contamina: sigue viendo 14", memberService.list(manager, {}).length === 14);

console.log("== 5. Coach completa una tarea asignada a él ==");
const coach1Task = orgScope("org_centro").tasks().find((t) => t.assignedToUserId === "usr_a_c1" && t.status !== "completed");
if (coach1Task) {
  const done = taskService.setCompleted(coach1, coach1Task.id, true);
  ok("Coach1 completa su tarea => completedAt", done.status === "completed" && !!done.completedAt);
} else ok("Coach1 tiene una tarea para completar", false, "no encontrada");
// Coach NO completa tarea de otro
const otherTask = orgScope("org_centro").tasks().find((t) => t.assignedToUserId !== "usr_a_c1" && t.status !== "completed");
if (otherTask) expectForbidden("Coach1 NO completa tarea de otro", () => taskService.setCompleted(coach1, otherTask.id, true), "FORBIDDEN");

console.log("== 6. Coach no edita configuración ==");
expectForbidden("Coach NO puede settings.update", () => settingsService.update(coach1, { brandingColor: "#000000" }), "FORBIDDEN");
expectForbidden("Coach NO puede settings.read (config global)", () => settingsService.get(coach1), "FORBIDDEN");
// Manager tampoco puede update (config crítica)
expectForbidden("Manager NO puede settings.update", () => settingsService.update(manager, { brandingColor: "#000000" }), "FORBIDDEN");
ok("Owner SÍ puede settings.update", (() => { try { settingsService.update(owner, { brandingColor: "#16623d" }); return true; } catch { return false; } })());

console.log("== 7. Alertas filtradas por organización (y rol) ==");
const ownerAlerts = alertService.list(owner, {});
ok("Owner ve alertas de su org", ownerAlerts.every((a) => a.organizationId === "org_centro"));
const ownerBAlerts = alertService.list(ownerB, {});
ok("Owner B ve solo alertas de B", ownerBAlerts.every((a) => a.organizationId === "org_norte"));
ok("Sin solape de alertas entre orgs", !ownerAlerts.some((a) => ownerBAlerts.find((b) => b.id === a.id)));
// Coach solo ve alertas de SUS socios
const coach1Alerts = alertService.list(coach1, {});
ok("Coach1 solo ve alertas de sus socios", coach1Alerts.every((a) => coach1Members.includes(a.memberId)));

console.log("== 8. Tareas se crean siempre con organizationId del contexto ==");
const created = taskService.create(manager, { title: "Tarea de prueba RBAC", assignedToUserId: "usr_a_c1", priority: "medium", status: "pending", description: null, memberId: null, dueDate: null });
ok("Tarea creada con org del contexto", created.organizationId === "org_centro");
// Aunque el manager intentara crear para otra org, no hay forma: la org sale del ctx, no del input.

console.log("== Matriz can() puntual ==");
ok("owner can settings.update", can(owner.user, "settings.update"));
ok("manager !can settings.update", !can(manager.user, "settings.update"));
ok("coach !can report.generate", !can(coach1.user, "report.generate"));
ok("coach can message.use (con ownership)", can(coach1.user, "message.use", { ownerCoachId: "cph_a1" }));
ok("coach !can message.use de otro coach", !can(coach1.user, "message.use", { ownerCoachId: "cph_a2" }));

console.log(fail === 0 ? "\nRBAC + MULTI-TENANT OK \u2705" : `\n${fail} fallo(s) \u274c`);
process.exit(fail === 0 ? 0 : 1);
