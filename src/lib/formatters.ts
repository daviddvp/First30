/* Etiquetas y "tonos" de presentación. El tono coincide con las variantes
   del componente Badge, manteniendo la decisión de color centralizada. */
import type { MemberStatus, RiskLevel, Priority, MemberLevel } from "../types";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

export function statusLabel(s: MemberStatus): string {
  return ({
    in_progress: "En progreso", at_risk: "En riesgo", activated: "Activado",
    no_coach: "Sin coach", completed: "Completado", churned: "Baja",
  } as const)[s];
}
export function statusTone(s: MemberStatus): Tone {
  return ({
    in_progress: "info", at_risk: "danger", activated: "success",
    no_coach: "warning", completed: "neutral", churned: "neutral",
  } as const)[s];
}
export function riskLabel(r: RiskLevel): string {
  return ({ high: "Alto", medium: "Medio", low: "Bajo" } as const)[r];
}
export function riskTone(r: RiskLevel): Tone {
  return ({ high: "danger", medium: "warning", low: "success" } as const)[r];
}
export function priorityLabel(p: Priority): string {
  return ({ high: "Alta", medium: "Media", low: "Baja" } as const)[p];
}
export function priorityTone(p: Priority): Tone {
  return ({ high: "danger", medium: "warning", low: "info" } as const)[p];
}
export function levelLabel(l: MemberLevel): string {
  return ({ beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado" } as const)[l];
}
export function initials(name: string): string {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}
export function firstName(name: string): string {
  return name.split(" ")[0];
}
export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}
export function formatRelative(iso: string | null, nowIso = "2026-05-30T09:00:00.000Z"): string {
  if (!iso) return "Sin registro";
  const days = Math.floor((new Date(nowIso).getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  return `Hace ${days} días`;
}
/** Rellena {{variable}} en el cuerpo de una plantilla. */
export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}
