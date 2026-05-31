/* Motor de onboarding: deriva el estado del socio a partir de señales
   (coach, alertas, score, día). Puro y sin React. Soporta override manual:
   si el socio fue marcado manualmente, se respeta y se indica el origen. */
import type { MemberContext } from "./engine-input";
import { computeActivationScore } from "./activation-score";
import { evaluateRisk } from "./risk-engine";
import type { MemberStatus } from "../types";

export type StatusSource = "auto" | "manual";

export interface OnboardingState {
  status: MemberStatus;
  source: StatusSource;
  reason: string;            // por qué se derivó este estado
  activationScore: number;
}

/** Estados que solo puede fijar una persona; el motor no los pisa. */
const MANUAL_ONLY: MemberStatus[] = ["churned"];

export function deriveStatus(
  ctx: MemberContext,
  opts: { manualOverride?: MemberStatus | null } = {},
): OnboardingState {
  const { score } = computeActivationScore(ctx);
  const risk = evaluateRisk(ctx);
  const m = ctx.member;

  // 1) Override manual explícito (o estado solo-manual ya presente).
  if (opts.manualOverride) {
    return { status: opts.manualOverride, source: "manual",
      reason: "Estado fijado manualmente por el equipo", activationScore: score };
  }
  if (MANUAL_ONLY.includes(m.status)) {
    return { status: m.status, source: "manual",
      reason: "Estado de baja gestionado manualmente", activationScore: score };
  }

  // 2) Reglas automáticas, en orden de prioridad.
  const secondVisit = ctx.attendances.length >= 2;

  if (m.assignedCoachId === null) {
    return { status: "no_coach", source: "auto",
      reason: "No tiene coach asignado", activationScore: score };
  }
  if (m.onboardingDay >= 30) {
    return { status: "completed", source: "auto",
      reason: "Ha alcanzado el día 30 del onboarding", activationScore: score };
  }
  const hasOpenHighOrMed = risk.findings.some((f) => f.riskLevel === "high" || f.riskLevel === "medium")
    || ctx.openAlerts.some((a) => (a.riskLevel === "high" || a.riskLevel === "medium") && a.status !== "resolved");
  if (hasOpenHighOrMed) {
    return { status: "at_risk", source: "auto",
      reason: risk.findings[0]?.reason ?? "Tiene una alerta de riesgo abierta", activationScore: score };
  }
  if (score >= 70 && secondVisit) {
    return { status: "activated", source: "auto",
      reason: `Score ${score} y segunda visita realizada`, activationScore: score };
  }
  return { status: "in_progress", source: "auto",
    reason: "Avanza en su onboarding sin alertas activas", activationScore: score };
}
