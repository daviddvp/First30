// ─────────────────────────────────────────────────────────────────────────────
// First30 — Job de reglas de onboarding
//
// Detecta socios en riesgo y crea alertas/tareas de forma IDEMPOTENTE.
// Estrategia de deduplicación: ruleKey = "{orgId}:{ruleType}:{memberId}"
//   - Antes de crear alerta/tarea, busca una abierta con el mismo ruleKey.
//   - Si existe, no crea duplicado.
//   - El job puede ejecutarse múltiples veces sin efectos secundarios.
//
// Reglas implementadas:
//   1. no_return_7d      — No volvió en N días (configurable, default 7)
//   2. low_attendance_14d — Menos de N asistencias en 14 días (default 2)
//   3. no_coach          — Sin coach asignado
//   4. checkin_no_response — Check-in enviado sin respuesta
//   5. injury_no_adaptation — Lesión sin nota de adaptación
//   6. Recalcula activationScore y actualiza estado derivado
// ─────────────────────────────────────────────────────────────────────────────
import { prisma } from "@/lib/db";
import { alertRepository } from "../repositories/alert.repository";
import { taskRepository } from "../repositories/task.repository";
import { memberRepository } from "../repositories/member.repository";
import { auditRepository } from "../repositories/audit.repository";
import { buildMemberContext } from "../services/insight.service";
import { computeActivationScore } from "@/lib/activation-score";
import { deriveStatus } from "@/lib/onboarding-engine";

export interface JobResult {
  organizationId: string;
  membersProcessed: number;
  alertsCreated: number;
  tasksCreated: number;
  scoresUpdated: number;
  errors: string[];
}

export async function runOnboardingRulesJob(orgId: string): Promise<JobResult> {
  const result: JobResult = {
    organizationId: orgId,
    membersProcessed: 0, alertsCreated: 0, tasksCreated: 0, scoresUpdated: 0, errors: [],
  };

  // Cargar configuración de reglas para la organización
  const rulesConfig = await prisma.onboardingRule.findMany({ where: { organizationId: orgId, enabled: true } });
  const ruleMap = new Map(rulesConfig.map((r) => [r.type, r]));

  const noReturnThreshold  = ruleMap.get("no_return_7d")?.thresholdValue ?? 7;
  const lowAttThreshold    = ruleMap.get("low_attendance_14d")?.thresholdValue ?? 2;

  // Socios activos (excluir completed y churned para las reglas de onboarding)
  const members = await memberRepository.list(orgId, {
    status: undefined, // todos — filtramos en lógica
  });
  const activeMembers = members.filter((m) => m.status !== "completed" && m.status !== "churned");

  const now = new Date();

  for (const member of activeMembers) {
    result.membersProcessed++;
    try {
      // ── Regla 1: no_return_7d ────────────────────────────────────────────
      if (ruleMap.get("no_return_7d")?.enabled) {
        const lastAt = member.lastAttendanceAt ? new Date(member.lastAttendanceAt) : null;
        const daysSince = lastAt ? Math.floor((now.getTime() - lastAt.getTime()) / 86_400_000) : 999;

        if (daysSince >= noReturnThreshold) {
          const ruleKey = `${orgId}:no_return_7d:${member.id}`;
          const existing = await alertRepository.findOpenByRuleKey(orgId, ruleKey);
          if (!existing) {
            await alertRepository.create(orgId, {
              memberId: member.id, riskLevel: "high",
              reason: `No volvió en los últimos ${daysSince} días`,
              daysSinceLastAttendance: daysSince,
              suggestedAction: "Contactar al socio y ofrecer clase de reincorporación",
              suggestedMessage: null, priority: "high", status: "open",
              resolvedAt: null, resolvedNote: null, snoozeUntil: null, ruleKey,
            });
            result.alertsCreated++;

            // Crear tarea recomendada asociada
            const taskKey = `${orgId}:no_return_7d:task:${member.id}`;
            const existingTask = await taskRepository.findOpenByRuleKey(orgId, taskKey);
            if (!existingTask) {
              await taskRepository.create(orgId, {
                memberId: member.id, assignedToUserId: null,
                title: `Contactar a ${member.fullName} — no volvió en ${daysSince} días`,
                description: null, priority: "high", status: "today",
                dueDate: now.toISOString(), completedAt: null, ruleKey: taskKey,
              });
              result.tasksCreated++;
            }
          }
        }
      }

      // ── Regla 2: low_attendance_14d ──────────────────────────────────────
      if (ruleMap.get("low_attendance_14d")?.enabled) {
        const cutoff = new Date(now.getTime() - 14 * 86_400_000);
        const recentCount = await prisma.attendance.count({
          where: { organizationId: orgId, memberId: member.id, classDate: { gte: cutoff } },
        });
        if (recentCount < lowAttThreshold) {
          const ruleKey = `${orgId}:low_attendance_14d:${member.id}`;
          const existing = await alertRepository.findOpenByRuleKey(orgId, ruleKey);
          if (!existing) {
            await alertRepository.create(orgId, {
              memberId: member.id, riskLevel: "medium",
              reason: `Solo ${recentCount} asistencias en los últimos 14 días`,
              daysSinceLastAttendance: null,
              suggestedAction: "Proponer horario fijo para consolidar hábito",
              suggestedMessage: null, priority: "medium", status: "open",
              resolvedAt: null, resolvedNote: null, snoozeUntil: null, ruleKey,
            });
            result.alertsCreated++;
          }
        }
      }

      // ── Regla 3: no_coach ────────────────────────────────────────────────
      if (ruleMap.get("no_coach")?.enabled && !member.assignedCoachId) {
        const ruleKey = `${orgId}:no_coach:${member.id}`;
        const existingTask = await taskRepository.findOpenByRuleKey(orgId, ruleKey);
        if (!existingTask) {
          await taskRepository.create(orgId, {
            memberId: member.id, assignedToUserId: null,
            title: `Asignar coach a ${member.fullName}`,
            description: "Este socio lleva sin coach asignado. Asignarle uno lo antes posible.",
            priority: "high", status: "today",
            dueDate: now.toISOString(), completedAt: null, ruleKey,
          });
          result.tasksCreated++;
        }
      }

      // ── Regla 4: checkin_no_response ─────────────────────────────────────
      if (ruleMap.get("checkin_no_response")?.enabled) {
        const unanswered = await prisma.checkIn.count({
          where: { organizationId: orgId, memberId: member.id, status: "sent" },
        });
        if (unanswered > 0) {
          const ruleKey = `${orgId}:checkin_no_response:${member.id}`;
          const existing = await alertRepository.findOpenByRuleKey(orgId, ruleKey);
          if (!existing) {
            await alertRepository.create(orgId, {
              memberId: member.id, riskLevel: "medium",
              reason: `${unanswered} check-in${unanswered > 1 ? "s" : ""} sin respuesta`,
              daysSinceLastAttendance: null,
              suggestedAction: "Hacer seguimiento personal del check-in",
              suggestedMessage: null, priority: "medium", status: "open",
              resolvedAt: null, resolvedNote: null, snoozeUntil: null, ruleKey,
            });
            result.alertsCreated++;
          }
        }
      }

      // ── Regla 5: injury_no_adaptation ────────────────────────────────────
      if (member.limitations && member.limitations.length > 0) {
        const hasAdaptationTask = await prisma.task.findFirst({
          where: {
            organizationId: orgId, memberId: member.id,
            title: { contains: "escal", mode: "insensitive" },
            status: { in: ["today", "this_week", "pending"] },
          },
        });
        if (!hasAdaptationTask) {
          const ruleKey = `${orgId}:injury_no_adaptation:${member.id}`;
          const existingTask = await taskRepository.findOpenByRuleKey(orgId, ruleKey);
          if (!existingTask) {
            await taskRepository.create(orgId, {
              memberId: member.id, assignedToUserId: null,
              title: `Revisar adaptación de ejercicios — ${member.fullName}`,
              description: `Limitación registrada: ${member.limitations}`,
              priority: "medium", status: "this_week",
              dueDate: null, completedAt: null, ruleKey,
            });
            result.tasksCreated++;
          }
        }
      }

      // ── Recalcular activationScore ────────────────────────────────────────
      const ctx = await buildMemberContext(orgId, member.id);
      const scoreResult = computeActivationScore(ctx);
      const newState = deriveStatus(ctx);

      if (scoreResult.score !== member.activationScore || newState.status !== member.status) {
        await prisma.member.update({
          where: { id: member.id },
          data: {
            activationScore: scoreResult.score,
            status: newState.status,
            riskLevel: ctx.member.riskLevel,
          },
        });
        result.scoresUpdated++;
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`[${member.id}] ${msg}`);
    }
  }

  // Registrar en audit log
  await auditRepository.record(orgId, null, "Job", orgId, "job_run", {
    membersProcessed: result.membersProcessed,
    alertsCreated: result.alertsCreated,
    tasksCreated: result.tasksCreated,
    scoresUpdated: result.scoresUpdated,
    errors: result.errors.length,
  });

  return result;
}
