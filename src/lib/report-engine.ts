/* Motor de informes: calcula el informe semanal avanzado a partir de datos ya
   scoped por organización (los recibe, no hace queries propias). Puro y
   testeable. Incluye comparativa con la semana anterior, distribución por
   coach y dos versiones de resumen (dirección / coaches). */
import type {
  Member, Task, RiskAlert, CoachProfile, User, WeeklyMetrics, ID,
} from "../types";
import { firstName } from "./formatters";

export interface ReportInput {
  organizationId: ID;
  members: Member[];
  tasks: Task[];
  alerts: RiskAlert[];          // todas las alertas de la org (open/snoozed/resolved)
  coaches: CoachProfile[];
  users: User[];
  /** Métricas de la semana anterior, para comparar (opcional). */
  previous?: WeeklyMetrics | null;
}

export interface MetricDelta {
  value: number;
  previous: number | null;
  delta: number | null;        // value - previous
  direction: "up" | "down" | "flat" | "na";
}
export interface CoachDistributionRow {
  coachId: ID;
  coachName: string;
  members: number;
  atRisk: number;
  load: number;                 // 0–1
}
export interface Recommendation {
  priority: "high" | "medium" | "low";
  text: string;
  memberId: ID | null;
}
export interface AdvancedReport {
  organizationId: ID;
  metrics: WeeklyMetrics;
  comparison: Record<keyof Pick<WeeklyMetrics, "secondVisitRate" | "activationRate" | "newMembers" | "atRisk">, MetricDelta>;
  openAlerts: RiskAlert[];
  resolvedAlerts: RiskAlert[];
  coachDistribution: CoachDistributionRow[];
  membersWithoutSecondVisit: Member[];
  membersWithoutCoach: Member[];
  membersReachingDay30: Member[];
  tasksCompleted: number;
  tasksPending: number;
  recommendations: Recommendation[];
  executiveSummary: string;     // versión para dirección
  coachSummary: string;         // versión para coaches
}

function delta(value: number, previous: number | null | undefined): MetricDelta {
  if (previous == null) return { value, previous: null, delta: null, direction: "na" };
  const d = Math.round((value - previous) * 1000) / 1000;
  return { value, previous, delta: d, direction: d > 0 ? "up" : d < 0 ? "down" : "flat" };
}

function computeMetrics(input: ReportInput): WeeklyMetrics {
  const { members, tasks } = input;
  const activated = members.filter((m) => m.status === "activated").length;
  const completed = members.filter((m) => m.status === "completed").length;
  const atRisk = members.filter((m) => m.status === "at_risk").length;
  const noCoach = members.filter((m) => m.assignedCoachId === null).length;
  const day30 = members.filter((m) => m.onboardingDay >= 30).length;
  const secondVisits = members.filter((m) => m.activationScore >= 50).length;
  const tasksCompleted = tasks.filter((t) => t.status === "completed").length;
  const total = Math.max(members.length, 1);
  return {
    newMembers: members.length,
    secondVisits,
    activated: activated + completed,
    noSecondVisit: members.filter((m) => m.activationScore < 50 && m.status !== "completed").length,
    noReturn: members.filter((m) => m.riskReason?.includes("No volvió")).length,
    noCoach,
    day30Completed: day30,
    tasksCompleted,
    secondVisitRate: secondVisits / total,
    activationRate: (activated + completed) / total,
    avgAttendanceFirst14: Math.round((members.reduce((s, m) => s + Math.min(m.activationScore / 25, 6), 0) / total) * 10) / 10,
    atRisk,
  };
}

function coachName(input: ReportInput, coach: CoachProfile): string {
  return input.users.find((u) => u.id === coach.userId)?.name ?? coach.id;
}

function buildCoachDistribution(input: ReportInput): CoachDistributionRow[] {
  return input.coaches.map((c) => {
    const mine = input.members.filter((m) => m.assignedCoachId === c.id);
    const active = mine.filter((m) => m.status !== "completed" && m.status !== "churned").length;
    return {
      coachId: c.id,
      coachName: coachName(input, c),
      members: mine.length,
      atRisk: mine.filter((m) => m.status === "at_risk").length,
      load: c.maxActiveNewMembers > 0 ? Math.min(active / c.maxActiveNewMembers, 1) : 0,
    };
  }).sort((a, b) => b.members - a.members);
}

function buildRecommendations(input: ReportInput, openAlerts: RiskAlert[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const order = { high: 0, medium: 1, low: 2 } as const;
  for (const a of [...openAlerts].sort((x, y) => order[x.priority] - order[y.priority])) {
    const m = input.members.find((mm) => mm.id === a.memberId);
    if (!m) continue;
    recs.push({ priority: a.priority, text: `${a.suggestedAction} — ${firstName(m.fullName)}`, memberId: m.id });
  }
  // Sin coach => recomendación de gestión.
  for (const m of input.members.filter((mm) => mm.assignedCoachId === null)) {
    recs.push({ priority: "high", text: `Asignar coach a ${firstName(m.fullName)}`, memberId: m.id });
  }
  return recs.slice(0, 8);
}

function buildExecutiveSummary(m: WeeklyMetrics, recs: Recommendation[]): string {
  const top = recs.filter((r) => r.priority === "high").slice(0, 2).map((r) => r.text.split("—").pop()?.trim()).filter(Boolean);
  const action = top.length ? ` Acción prioritaria: ${top.join(" y ")}.` : " Sin acciones críticas pendientes.";
  return `Esta semana hay ${m.newMembers} socios en onboarding. ${m.secondVisits} con buena activación (${Math.round(m.secondVisitRate * 100)}% second visit), ${m.noReturn} no volvieron tras la primera clase y ${m.noCoach} sin coach. ${m.day30Completed} alcanzan el día 30. Activación global del ${Math.round(m.activationRate * 100)}%.${action}`;
}

function buildCoachSummary(dist: CoachDistributionRow[], m: WeeklyMetrics): string {
  const overloaded = dist.filter((d) => d.load > 0.8).map((d) => d.coachName);
  const withRisk = dist.filter((d) => d.atRisk > 0).map((d) => `${d.coachName} (${d.atRisk})`);
  const parts = [`${m.atRisk} socios en riesgo repartidos en el equipo.`];
  if (withRisk.length) parts.push(`Seguimiento prioritario: ${withRisk.join(", ")}.`);
  if (overloaded.length) parts.push(`Coaches al límite de carga: ${overloaded.join(", ")}.`);
  parts.push(`${m.tasksCompleted} tareas completadas esta semana.`);
  return parts.join(" ");
}

/** Calcula el informe avanzado completo. */
export function buildAdvancedReport(input: ReportInput): AdvancedReport {
  const metrics = computeMetrics(input);
  const openAlerts = input.alerts.filter((a) => a.status === "open");
  const resolvedAlerts = input.alerts.filter((a) => a.status === "resolved");
  const coachDistribution = buildCoachDistribution(input);
  const recommendations = buildRecommendations(input, openAlerts);

  return {
    organizationId: input.organizationId,
    metrics,
    comparison: {
      secondVisitRate: delta(metrics.secondVisitRate, input.previous?.secondVisitRate),
      activationRate: delta(metrics.activationRate, input.previous?.activationRate),
      newMembers: delta(metrics.newMembers, input.previous?.newMembers),
      atRisk: delta(metrics.atRisk, input.previous?.atRisk),
    },
    openAlerts,
    resolvedAlerts,
    coachDistribution,
    membersWithoutSecondVisit: input.members.filter((m) => m.activationScore < 50 && m.status !== "completed"),
    membersWithoutCoach: input.members.filter((m) => m.assignedCoachId === null),
    membersReachingDay30: input.members.filter((m) => m.onboardingDay >= 30),
    tasksCompleted: input.tasks.filter((t) => t.status === "completed").length,
    tasksPending: input.tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled").length,
    recommendations,
    executiveSummary: buildExecutiveSummary(metrics, recommendations),
    coachSummary: buildCoachSummary(coachDistribution, metrics),
  };
}
