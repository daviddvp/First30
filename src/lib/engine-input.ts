/* Entrada común de los motores de negocio. Los motores son puros: reciben este
   contexto ya cargado (por un service, scoped por organizationId) y no hacen
   queries. Esto los hace testeables y portables fuera de React/Next. */
import type {
  Member, Attendance, CheckIn, RiskAlert, OnboardingRule, ID,
} from "../types";

export interface MemberContext {
  organizationId: ID;
  member: Member;
  attendances: Attendance[];      // del socio, orden ascendente por classDate
  checkIns: CheckIn[];            // del socio
  openAlerts: RiskAlert[];        // alertas abiertas/snoozed del socio
  rules: OnboardingRule[];        // reglas de la organización
  hasUpcomingClass?: boolean;     // ¿tiene próxima clase reservada? (señal externa)
  cancellationStreak?: number;    // nº de clases canceladas seguidas (señal externa)
}

/** Helper: ¿está habilitada una regla? (por defecto sí, si no está definida). */
export function ruleEnabled(rules: OnboardingRule[], type: OnboardingRule["type"]): boolean {
  const r = rules.find((x) => x.type === type);
  return r ? r.enabled : true;
}
export function ruleThreshold(rules: OnboardingRule[], type: OnboardingRule["type"], fallback: number): number {
  const r = rules.find((x) => x.type === type);
  return r ? r.thresholdValue : fallback;
}
