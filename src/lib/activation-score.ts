/* Activation Score (0–100): mide cuán integrado está un socio en su primer mes.
   Función pura: recibe el contexto del socio y devuelve score + desglose. */
import type { MemberContext } from "./engine-input";
import { daysBetween } from "./date";
import type { RiskLevel } from "../types";

export interface ScoreBreakdown {
  label: string;
  points: number;
  applied: boolean;
}
export interface ActivationScoreResult {
  score: number;                 // 0–100 (acotado)
  breakdown: ScoreBreakdown[];
  classification: RiskLevel;     // high | medium | low (riesgo)
  madeSecondVisit: boolean;
}

/** ¿Hizo una segunda visita? = al menos 2 asistencias en días distintos. */
export function madeSecondVisit(ctx: MemberContext): boolean {
  const days = new Set(ctx.attendances.map((a) => a.classDate.slice(0, 10)));
  return days.size >= 2;
}

/** Asistencias dentro de los primeros 14 días desde el alta. */
export function attendancesInFirst14(ctx: MemberContext): number {
  const join = new Date(ctx.member.joinDate);
  return ctx.attendances.filter((a) => {
    const d = daysBetween(join, new Date(a.classDate));
    return d >= 0 && d <= 14;
  }).length;
}

export function computeActivationScore(ctx: MemberContext): ActivationScoreResult {
  const secondVisit = madeSecondVisit(ctx);
  const atts14 = attendancesInFirst14(ctx);
  const hasCoach = ctx.member.assignedCoachId !== null;
  const respondedCheckIn = ctx.checkIns.some((c) => c.status === "responded");
  const upcoming = ctx.hasUpcomingClass === true;
  const highOpen = ctx.openAlerts.some((a) => a.riskLevel === "high" && a.status !== "resolved");
  const medOpen = ctx.openAlerts.some((a) => a.riskLevel === "medium" && a.status !== "resolved");

  const breakdown: ScoreBreakdown[] = [
    { label: "Hizo segunda visita", points: 25, applied: secondVisit },
    { label: "2+ asistencias en 14 días", points: 20, applied: atts14 >= 2 },
    { label: "Tiene coach asignado", points: 15, applied: hasCoach },
    { label: "Respondió a un check-in", points: 15, applied: respondedCheckIn },
    { label: "Próxima clase prevista", points: 15, applied: upcoming },
    { label: "Alerta de riesgo alto abierta", points: -20, applied: highOpen },
    { label: "Alerta de riesgo medio abierta", points: -10, applied: medOpen },
  ];

  const raw = breakdown.reduce((s, b) => (b.applied ? s + b.points : s), 0);
  const score = Math.max(0, Math.min(100, raw));

  const classification: RiskLevel = score <= 39 ? "high" : score <= 69 ? "medium" : "low";
  return { score, breakdown, classification, madeSecondVisit: secondVisit };
}
