/* Tests de los motores puros usando el contexto real del seed (vía insightService)
   y casos sintéticos para reglas concretas. Ejecutar con: npx tsx scripts/test-engines.ts */
import { buildMemberContext, insightService } from "../src/server/services/insight.service";
import { computeActivationScore } from "../src/lib/activation-score";
import { evaluateRisk } from "../src/lib/risk-engine";
import { deriveStatus } from "../src/lib/onboarding-engine";
import { nextBestAction } from "../src/lib/next-best-action";
import type { MemberContext } from "../src/lib/engine-input";

let fail = 0;
const ok = (label: string, cond: boolean, extra = "") => {
  console.log(`${cond ? "\u2713" : "\u2717"} ${label}${extra ? ` \u2014 ${extra}` : ""}`);
  if (!cond) fail++;
};

const ORG = "org_centro";

// ---- Socios obligatorios desde el seed ----
const marta = insightService.forMember(ORG, "mbr_marta");
const david = insightService.forMember(ORG, "mbr_david");
const laura = insightService.forMember(ORG, "mbr_laura");
const carlos = insightService.forMember(ORG, "mbr_carlos");
const ana = insightService.forMember(ORG, "mbr_ana");

console.log("== Marta (no volvió, riesgo alto) ==");
ok("Marta dispara regla no_return_7d", marta.risk.findings.some((f) => f.rule === "no_return_7d"));
ok("Marta riesgo top high", marta.risk.topRisk === "high");
ok("Marta estado at_risk (auto)", marta.state.status === "at_risk" && marta.state.source === "auto");
ok("Marta NBA = reactivación suave", /[Rr]eactivar/.test(marta.nextAction.title) && marta.nextAction.templateCategory === "No volvió en 7 días");
ok("Marta score bajo (<40)", marta.score.score < 40, `${marta.score.score}`);

console.log("== David (sin coach) ==");
ok("David dispara regla no_coach", david.risk.findings.some((f) => f.rule === "no_coach"));
ok("David estado no_coach", david.state.status === "no_coach");
ok("David NBA = asignar coach", david.nextAction.ctaKind === "assign_coach");

console.log("== Laura (en progreso, día 14) ==");
ok("Laura NBA = check-in de hábito", /[Cc]heck-in/.test(laura.nextAction.title), laura.nextAction.title);
ok("Laura no es alto riesgo", laura.risk.topRisk !== "high", laura.risk.topRisk);

console.log("== Carlos (día 30, activado) ==");
ok("Carlos NBA = resumen día 30", carlos.nextAction.templateCategory === "Día 30" && carlos.nextAction.ctaKind === "send_summary");
ok("Carlos estado completed (día>=30)", carlos.state.status === "completed");

console.log("== Ana (vuelve de lesión) ==");
ok("Ana dispara injury_no_adaptation", ana.risk.findings.some((f) => f.rule === "injury_no_adaptation"));
ok("Ana NBA = revisar escalados", ana.nextAction.ctaKind === "review_scaling" && ana.nextAction.templateCategory === "Lesión / molestia");

// ---- Casos sintéticos para reglas y score ----
function baseCtx(over: Partial<MemberContext["member"]> = {}): MemberContext {
  return {
    organizationId: ORG,
    member: {
      id: "mbr_x", organizationId: ORG, fullName: "Test Persona", email: "t@x.com", phone: "",
      joinDate: "2026-05-16T09:00:00.000Z", onboardingDay: 14, status: "in_progress",
      riskLevel: "low", riskReason: null, mainGoal: "salud", level: "beginner",
      limitations: null, fears: null, acquisitionSource: "Web", assignedCoachId: "cph_a1",
      lastAttendanceAt: "2026-05-28T09:00:00.000Z", nextRecommendedAction: "", activationScore: 0,
      createdAt: "", updatedAt: "", ...over,
    },
    attendances: [], checkIns: [], openAlerts: [], rules: [],
    hasUpcomingClass: false, cancellationStreak: 0,
  };
}

console.log("== Reglas sintéticas ==");
// Regla 2: <2 asistencias en 14 días (día 14, 1 asistencia)
const lowAtt = baseCtx();
lowAtt.attendances = [{ id: "a", organizationId: ORG, memberId: "mbr_x", classDate: "2026-05-17T09:00:00.000Z", classType: "WOD", coachId: "cph_a1", notes: null, createdAt: "" }];
ok("regla low_attendance_14d se dispara", evaluateRisk(lowAtt).findings.some((f) => f.rule === "low_attendance_14d"));

// Regla 4: check-in día 3 missed
const missed = baseCtx();
missed.checkIns = [{ id: "c", organizationId: ORG, memberId: "mbr_x", coachId: "cph_a1", day: 3, status: "missed", sentiment: null, notes: null, createdAt: "" }];
ok("regla checkin_no_response se dispara", evaluateRisk(missed).findings.some((f) => f.rule === "checkin_no_response"));

// Regla 5: dos cancelaciones seguidas
const cancel = baseCtx();
cancel.cancellationStreak = 2;
ok("regla cancel_streak se dispara", evaluateRisk(cancel).findings.some((f) => f.rule === "cancel_streak"));

// Regla 6: lesión sin adaptación vs con adaptación
const injury = baseCtx({ limitations: "Vuelve de lesión de rodilla" });
ok("lesión sin adaptación => finding", evaluateRisk(injury).findings.some((f) => f.rule === "injury_no_adaptation"));
const injuryOk = baseCtx({ limitations: "Vuelve de lesión de rodilla" });
injuryOk.attendances = [{ id: "a", organizationId: ORG, memberId: "mbr_x", classDate: "2026-05-25T09:00:00.000Z", classType: "WOD", coachId: "cph_a1", notes: "Trabajados escalados de rodilla", createdAt: "" }];
ok("lesión CON adaptación => sin finding", !evaluateRisk(injuryOk).findings.some((f) => f.rule === "injury_no_adaptation"));

// Score perfecto vs penalizado
const perfect = baseCtx();
perfect.attendances = [
  { id: "1", organizationId: ORG, memberId: "mbr_x", classDate: "2026-05-17T09:00:00.000Z", classType: "WOD", coachId: "cph_a1", notes: null, createdAt: "" },
  { id: "2", organizationId: ORG, memberId: "mbr_x", classDate: "2026-05-20T09:00:00.000Z", classType: "WOD", coachId: "cph_a1", notes: null, createdAt: "" },
];
perfect.checkIns = [{ id: "c", organizationId: ORG, memberId: "mbr_x", coachId: "cph_a1", day: 7, status: "responded", sentiment: "positive", notes: null, createdAt: "" }];
perfect.hasUpcomingClass = true;
const ps = computeActivationScore(perfect);
ok("score alto (25+20+15+15+15=90)", ps.score === 90, `${ps.score}`);
ok("clasificación low (activado)", ps.classification === "low");

// Override manual respeta y marca origen
const ov = deriveStatus(baseCtx(), { manualOverride: "activated" });
ok("override manual => source manual", ov.status === "activated" && ov.source === "manual");

// Coherencia: estado derivado nunca pisa churned del seed (Pablo Gil)
const churnedCtx = buildMemberContext(ORG, "mbr_pablog");
ok("churned se respeta como manual", deriveStatus(churnedCtx).status === "churned" && deriveStatus(churnedCtx).source === "manual");

console.log(fail === 0 ? "\nMOTORES OK \u2705" : `\n${fail} fallo(s) \u274c`);
process.exit(fail === 0 ? 0 : 1);
