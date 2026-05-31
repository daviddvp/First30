/* Tests del motor de informes. Ejecutar: npx tsx scripts/test-reports.ts */
import { contextForUser } from "../src/lib/auth";
import { reportService } from "../src/server/services/report.service";
import { buildAdvancedReport } from "../src/lib/report-engine";
import { orgScope } from "../src/data/mock-db";
import { AppError } from "../src/lib/errors";

let fail = 0;
const ok = (l: string, c: boolean, e = "") => { console.log(`${c ? "\u2713" : "\u2717"} ${l}${e ? ` \u2014 ${e}` : ""}`); if (!c) fail++; };

const owner = contextForUser("usr_a_owner");
const ownerB = contextForUser("usr_b_owner");
const coach1 = contextForUser("usr_a_c1");

console.log("== Métricas del informe ==");
const adv = reportService.advanced(owner);
ok("calcula newMembers = 14 (org A)", adv.metrics.newMembers === 14, `${adv.metrics.newMembers}`);
ok("secondVisitRate entre 0 y 1", adv.metrics.secondVisitRate >= 0 && adv.metrics.secondVisitRate <= 1);
ok("activationRate entre 0 y 1", adv.metrics.activationRate >= 0 && adv.metrics.activationRate <= 1);
ok("genera resumen ejecutivo no vacío", adv.executiveSummary.length > 30);
ok("genera resumen para coaches no vacío", adv.coachSummary.length > 20);
ok("distribución por coach incluye los 4 coaches de A", adv.coachDistribution.length === 4, `${adv.coachDistribution.length}`);
ok("recomendaciones priorizadas (high primero)", adv.recommendations.length === 0 || adv.recommendations[0].priority === "high");
ok("separa riesgos abiertos y resueltos", Array.isArray(adv.openAlerts) && Array.isArray(adv.resolvedAlerts));

console.log("== Aislamiento multi-tenant ==");
const advB = reportService.advanced(ownerB);
ok("informe B usa solo socios de B (6)", advB.metrics.newMembers === 6, `${advB.metrics.newMembers}`);
ok("informe A no incluye alertas de B", !adv.openAlerts.some((a) => advB.openAlerts.find((b) => b.id === a.id)));
ok("distribución B != distribución A", advB.coachDistribution[0]?.coachId !== adv.coachDistribution[0]?.coachId);

console.log("== Comparación con semana anterior ==");
const scope = orgScope("org_centro");
const withPrev = buildAdvancedReport({
  organizationId: "org_centro", members: scope.members(), tasks: scope.tasks(),
  alerts: scope.alerts(), coaches: scope.coachProfiles(), users: scope.users(),
  previous: { ...adv.metrics, secondVisitRate: adv.metrics.secondVisitRate - 0.1, atRisk: adv.metrics.atRisk + 1 } as never,
});
ok("comparación secondVisitRate => up", withPrev.comparison.secondVisitRate.direction === "up");
ok("comparación atRisk => down", withPrev.comparison.atRisk.direction === "down");
ok("sin previous => direction na", adv.comparison.secondVisitRate.direction === "na");

console.log("== Permisos ==");
// Coach con report.read recibe digest de SUS socios (no toda la org).
const digest = reportService.coachDigest(coach1);
const coach1Members = scope.members().filter((m) => m.assignedCoachId === "cph_a1").length;
ok("coach digest limitado a sus socios", digest.metrics.newMembers === coach1Members, `${digest.metrics.newMembers}/${coach1Members}`);
// report.generate requiere permiso (coach NO lo tiene).
try { reportService.generate(coach1); ok("coach NO puede generar informe", false); }
catch (e) { ok("coach NO puede generar informe", e instanceof AppError && e.code === "FORBIDDEN"); }
// owner sí.
ok("owner puede generar informe", (() => { try { reportService.generate(owner); return true; } catch { return false; } })());

console.log(fail === 0 ? "\nREPORT ENGINE OK \u2705" : `\n${fail} fallo(s) \u274c`);
process.exit(fail === 0 ? 0 : 1);
