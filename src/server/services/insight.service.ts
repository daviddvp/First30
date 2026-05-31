/* NOTA DE SEGURIDAD: este servicio recibe orgId directamente (no RequestContext)
   porque es una capa de LECTURA interna scoped por organización, consumida por
   member-detail.service (que ya valida permisos antes de invocarlo) y por server
   components con la org de sesión. No debe exponerse en un route handler sin que
   antes se haya comprobado el permiso correspondiente. */
/* Puente entre repositorios y motores puros. Carga el MemberContext scoped por
   organización y devuelve score, riesgo, estado derivado y next best action.
   La UI consume ESTO; nunca arma el contexto a mano. */
import { orgScope } from "@/data/mock-db";
import { computeActivationScore, type ActivationScoreResult } from "@/lib/activation-score";
import { evaluateRisk, type RiskResult } from "@/lib/risk-engine";
import { deriveStatus, type OnboardingState } from "@/lib/onboarding-engine";
import { nextBestAction, type NextBestAction } from "@/lib/next-best-action";
import type { MemberContext } from "@/lib/engine-input";
import { NotFoundError } from "@/lib/errors";
import type { ID } from "@/types";

export interface MemberInsight {
  score: ActivationScoreResult;
  risk: RiskResult;
  state: OnboardingState;
  nextAction: NextBestAction;
}

/** Construye el contexto de un socio desde los repos (sin tocar el seed en la UI). */
export function buildMemberContext(orgId: ID, memberId: ID): MemberContext {
  const scope = orgScope(orgId);
  const member = scope.member(memberId);
  if (!member) throw new NotFoundError("Socio");
  const attendances = scope.attendancesByMember(memberId);
  const checkIns = scope.checkInsByMember(memberId);
  const openAlerts = scope.alertsByMember(memberId).filter((a) => a.status !== "resolved");
  const rules = scope.onboardingRules();
  // Señales externas simuladas a partir de datos disponibles.
  const hasUpcomingClass = member.status === "activated" || member.status === "in_progress";
  const cancellationStreak = /cancel/i.test(member.riskReason ?? "") ? 2 : 0;
  return { organizationId: orgId, member, attendances, checkIns, openAlerts, rules, hasUpcomingClass, cancellationStreak };
}

export const insightService = {
  forMember(orgId: ID, memberId: ID): MemberInsight {
    const ctx = buildMemberContext(orgId, memberId);
    return {
      score: computeActivationScore(ctx),
      risk: evaluateRisk(ctx),
      state: deriveStatus(ctx),
      nextAction: nextBestAction(ctx),
    };
  },

  /** Resumen de riesgo de toda la organización (para dashboard / lista de riesgo). */
  riskForOrg(orgId: ID) {
    return orgScope(orgId).members()
      .map((m) => insightService.forMember(orgId, m.id))
      .filter((i) => i.risk.findings.length > 0)
      .sort((a, b) => {
        const o = { high: 3, medium: 2, low: 1 };
        return o[b.risk.topRisk] - o[a.risk.topRisk];
      });
  },
};
