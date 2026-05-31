/* Motor de riesgo: evalúa las reglas de abandono temprano y produce
   "hallazgos" (findings). Función pura, sin React ni queries: recibe el
   contexto del socio y devuelve qué alertas deberían existir y por qué.
   Un service decide luego si crear/actualizar RiskAlert a partir de esto. */
import type { MemberContext } from "./engine-input";
import { ruleEnabled, ruleThreshold } from "./engine-input";
import { madeSecondVisit, attendancesInFirst14 } from "./activation-score";
import { daysBetween } from "./date";
import type { RiskLevel, Priority, ID } from "../types";

export type RiskRuleId =
  | "no_return_7d" | "low_attendance_14d" | "no_coach"
  | "checkin_no_response" | "cancel_streak" | "injury_no_adaptation";

export interface RiskFinding {
  rule: RiskRuleId;
  riskLevel: RiskLevel;
  priority: Priority;
  reason: string;
  suggestedAction: string;
  suggestedTemplateCategory: string | null; // categoría de plantilla recomendada
  daysSinceLastAttendance: number | null;
}

export interface RiskResult {
  organizationId: ID;
  memberId: ID;
  findings: RiskFinding[];
  topRisk: RiskLevel;     // el mayor riesgo entre los hallazgos (low si no hay)
}

function daysSinceLast(ctx: MemberContext): number | null {
  if (!ctx.member.lastAttendanceAt) return null;
  return daysBetween(ctx.member.lastAttendanceAt);
}

/** Evalúa todas las reglas habilitadas y devuelve los hallazgos. */
export function evaluateRisk(ctx: MemberContext): RiskResult {
  const findings: RiskFinding[] = [];
  const dsla = daysSinceLast(ctx);
  const atts = ctx.attendances.length;

  // Regla 1 — No vuelve en 7 días tras la primera clase.
  if (ruleEnabled(ctx.rules, "no_return_7d")) {
    const threshold = ruleThreshold(ctx.rules, "no_return_7d", 7);
    if (atts >= 1 && !madeSecondVisit(ctx) && dsla !== null && dsla >= threshold) {
      findings.push({
        rule: "no_return_7d", riskLevel: "high", priority: "high",
        reason: `No vuelve desde hace ${dsla} días tras la primera clase`,
        suggestedAction: "Reactivación suave: ofrecer una clase de baja intensidad",
        suggestedTemplateCategory: "No volvió en 7 días", daysSinceLastAttendance: dsla,
      });
    }
  }

  // Regla 2 — Menos de 2 asistencias en los primeros 14 días.
  if (ruleEnabled(ctx.rules, "low_attendance_14d")) {
    const min = ruleThreshold(ctx.rules, "low_attendance_14d", 2);
    const past14 = ctx.member.onboardingDay >= 14;
    if (past14 && attendancesInFirst14(ctx) < min) {
      findings.push({
        rule: "low_attendance_14d", riskLevel: "medium", priority: "high",
        reason: `Menos de ${min} asistencias en los primeros 14 días`,
        suggestedAction: "Proponer un horario fijo y acompañar la vuelta",
        suggestedTemplateCategory: "Reactivación suave", daysSinceLastAttendance: dsla,
      });
    }
  }

  // Regla 3 — Sin coach asignado.
  if (ruleEnabled(ctx.rules, "no_coach") && ctx.member.assignedCoachId === null) {
    findings.push({
      rule: "no_coach", riskLevel: "medium", priority: "medium",
      reason: "Sin coach asignado",
      suggestedAction: "Asignar coach antes de su próxima clase",
      suggestedTemplateCategory: null, daysSinceLastAttendance: dsla,
    });
  }

  // Regla 4 — No responde al check-in de día 3 o 14.
  if (ruleEnabled(ctx.rules, "checkin_no_response")) {
    const missedKey = ctx.checkIns.some(
      (c) => (c.day === 3 || c.day === 14) && (c.status === "missed" || c.status === "sent"),
    );
    if (missedKey) {
      findings.push({
        rule: "checkin_no_response", riskLevel: "medium", priority: "medium",
        reason: "No ha respondido a un check-in clave (día 3 o 14)",
        suggestedAction: "Reintentar contacto personal y registrar sensación",
        suggestedTemplateCategory: "Check-in día 14", daysSinceLastAttendance: dsla,
      });
    }
  }

  // Regla 5 — Cancela dos clases seguidas.
  if ((ctx.cancellationStreak ?? 0) >= 2) {
    findings.push({
      rule: "cancel_streak", riskLevel: "medium", priority: "high",
      reason: "Canceló dos clases seguidas",
      suggestedAction: "Llamar y ofrecer un horario que encaje mejor",
      suggestedTemplateCategory: "Reactivación suave", daysSinceLastAttendance: dsla,
    });
  }

  // Regla 6 — Vuelve de lesión sin adaptación registrada.
  if (ctx.member.limitations && ctx.member.limitations.toLowerCase().includes("lesión")) {
    const hasAdaptationNote = ctx.attendances.some(
      (a) => a.notes && /escalad|adaptaci|adaptad/i.test(a.notes),
    );
    if (!hasAdaptationNote) {
      findings.push({
        rule: "injury_no_adaptation", riskLevel: "medium", priority: "high",
        reason: "Vuelve de lesión y no tiene adaptación de ejercicios registrada",
        suggestedAction: "Revisar escalados por lesión y confirmar una clase segura",
        suggestedTemplateCategory: "Lesión / molestia", daysSinceLastAttendance: dsla,
      });
    }
  }

  const order: Record<RiskLevel, number> = { high: 3, medium: 2, low: 1 };
  const topRisk = findings.reduce<RiskLevel>(
    (top, f) => (order[f.riskLevel] > order[top] ? f.riskLevel : top), "low",
  );

  // Ordenar hallazgos por riesgo y prioridad (más grave primero).
  const pOrder: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
  findings.sort((a, b) => order[b.riskLevel] - order[a.riskLevel] || pOrder[b.priority] - pOrder[a.priority]);

  return { organizationId: ctx.organizationId, memberId: ctx.member.id, findings, topRisk };
}
