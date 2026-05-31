/* Next Best Action: dada la situación del socio, devuelve la única acción
   más útil ahora, con la categoría de plantilla y un CTA. Puro y sin React. */
import type { MemberContext } from "./engine-input";
import { deriveStatus } from "./onboarding-engine";
import { evaluateRisk } from "./risk-engine";
import { madeSecondVisit } from "./activation-score";
import { firstName } from "./formatters";

export type ActionCtaKind = "assign_coach" | "send_message" | "review_scaling" | "send_summary" | "schedule_class" | "none";

export interface NextBestAction {
  title: string;                     // acción principal
  detail: string;                    // matiz / por qué
  ctaKind: ActionCtaKind;
  templateCategory: string | null;   // plantilla recomendada, si aplica
}

export function nextBestAction(ctx: MemberContext): NextBestAction {
  const name = firstName(ctx.member.fullName);
  const { status } = deriveStatus(ctx);
  const risk = evaluateRisk(ctx);
  const top = risk.findings[0];

  // 1) Sin coach: la acción es siempre asignarlo.
  if (status === "no_coach") {
    return {
      title: `Asignar coach a ${name}`,
      detail: "Asígnale un coach antes de su próxima clase para no perder el seguimiento.",
      ctaKind: "assign_coach", templateCategory: null,
    };
  }

  // 2) Día 30 completado: cierre y continuidad.
  if (status === "completed" || ctx.member.onboardingDay >= 30) {
    return {
      title: `Enviar resumen de día 30 a ${name}`,
      detail: "Comparte su progreso del primer mes y propón un plan de 2–3 sesiones/semana.",
      ctaKind: "send_summary", templateCategory: "Día 30",
    };
  }

  // 3) Hay riesgo: la acción la dicta el hallazgo principal.
  if (top) {
    if (top.rule === "injury_no_adaptation") {
      return {
        title: `Revisar escalados de ${name} por lesión`,
        detail: "Confirma una clase segura con ejercicios adaptados antes de que vuelva.",
        ctaKind: "review_scaling", templateCategory: "Lesión / molestia",
      };
    }
    if (top.rule === "no_return_7d") {
      return {
        title: `Reactivar a ${name} con un mensaje suave`,
        detail: "No ha vuelto tras la primera clase: propón una clase de baja intensidad sin presión.",
        ctaKind: "send_message", templateCategory: "No volvió en 7 días",
      };
    }
    return {
      title: `Contactar a ${name}`,
      detail: top.suggestedAction,
      ctaKind: "send_message", templateCategory: top.suggestedTemplateCategory,
    };
  }

  // 4) En progreso saludable: empujar hábito.
  if (madeSecondVisit(ctx) && ctx.member.onboardingDay >= 14) {
    return {
      title: `Check-in de hábito con ${name}`,
      detail: "Va bien: refuerza el hábito y recomiéndale 2 sesiones por semana.",
      ctaKind: "send_message", templateCategory: "Check-in día 14",
    };
  }

  // 5) Por defecto: recomendar próxima clase.
  return {
    title: `Recomendar la próxima clase a ${name}`,
    detail: "Sugiérele una clase que encaje con su objetivo para mantener la cadencia.",
    ctaKind: "schedule_class", templateCategory: "Recomendación de clase",
  };
}
