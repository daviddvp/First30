// ─────────────────────────────────────────────────────────────────────────────
// First30 — Servicio de importación CSV de socios
//
// Seguridad multi-tenant: organizationId SIEMPRE proviene del RequestContext.
// Nunca se acepta organizationId del cliente.
// La deduplicación solo compara dentro de la misma organización.
// ─────────────────────────────────────────────────────────────────────────────
import { prisma } from "@/lib/db";
import { memberRepository } from "../repositories/member.repository";
import { coachRepository } from "../repositories/coach.repository";
import { auditRepository } from "../repositories/audit.repository";
import { taskRepository } from "../repositories/task.repository";
import { alertRepository } from "../repositories/alert.repository";
import { assertCan } from "@/lib/permissions";
import { ForbiddenError } from "@/lib/errors";
import { parseCsvString } from "@/lib/csv/parse-csv";
import { autoMapColumns, applyMappings } from "@/lib/csv/map-columns";
import { validateRow } from "@/lib/csv/validate-member-import";
import { buildMemberContext } from "@/server/services/insight.service";
import { computeActivationScore } from "@/lib/activation-score";
import { deriveStatus } from "@/lib/onboarding-engine";
import { evaluateRisk } from "@/lib/risk-engine";
import type { RequestContext } from "@/lib/auth";
import { trackServerEvent } from "@/lib/analytics";
import type {
  ImportPreviewResponse,
  ImportConfirmResponse,
  ValidatedImportRow,
  ColumnMapping,
} from "@/lib/csv/member-import-types";

// ─── Preview ─────────────────────────────────────────────────────────────────

export async function previewMemberImport(
  ctx: RequestContext,
  csvText: string,
  customMappings?: ColumnMapping[],
): Promise<ImportPreviewResponse> {
  assertCan(ctx.user, "member.import");

  const { headers, rows: rawRows } = parseCsvString(csvText);

  if (headers.length === 0) {
    return {
      summary: { totalRows: 0, validRows: 0, rowsWithWarnings: 0, rowsWithErrors: 0, createCount: 0, updateCount: 0, possibleDuplicatesCount: 0, ignoredCount: 0 },
      mappings: [],
      rows: [],
    };
  }

  const mappings = customMappings ?? autoMapColumns(headers);

  // Cargar datos de la organización para deduplicación y lookup de coaches
  const [existingMembers, coaches] = await Promise.all([
    memberRepository.list(ctx.organizationId),
    coachRepository.list(ctx.organizationId),
  ]);

  const existingByEmail = new Map(
    existingMembers.filter((m) => m.email).map((m) => [m.email.toLowerCase(), m.id])
  );
  const existingByPhone = new Map(
    existingMembers.filter((m) => m.phone).map((m) => [m.phone.replace(/[\s\-\.]/g, ""), m.id])
  );
  const existingByNameDate = new Map(
    existingMembers.map((m) => {
      const key = `${m.fullName.toLowerCase()}|${m.joinDate.split("T")[0]}`;
      return [key, m.id];
    })
  );

  // Coach lookup por nombre (case-insensitive)
  const coachByName = new Map<string, string>();
  for (const coach of coaches) {
    const user = await coachRepository.userOf(ctx.organizationId, coach.id);
    if (user?.name) coachByName.set(user.name.toLowerCase(), coach.id);
  }

  const validatedRows: ValidatedImportRow[] = rawRows.map((raw, idx) => {
    const mapped = applyMappings(raw, mappings);
    return validateRow(
      { rowIndex: idx + 2, ...mapped }, // rowIndex empieza en 2 (fila 1 = cabeceras)
      { existingByEmail, existingByPhone, existingByNameDate, coachByName },
    );
  });

  const summary = {
    totalRows: validatedRows.length,
    validRows: validatedRows.filter((r) => r.action !== "error").length,
    rowsWithWarnings: validatedRows.filter((r) => r.warnings.length > 0 && r.action !== "error").length,
    rowsWithErrors: validatedRows.filter((r) => r.action === "error").length,
    createCount: validatedRows.filter((r) => r.action === "create").length,
    updateCount: validatedRows.filter((r) => r.action === "update").length,
    possibleDuplicatesCount: validatedRows.filter((r) => r.action === "duplicate_warning").length,
    ignoredCount: validatedRows.filter((r) => r.action === "skipped").length,
  };

  trackServerEvent("member_import_preview_generated", ctx, {
    totalRows: summary.totalRows,
    errors: summary.rowsWithErrors,
    warnings: summary.rowsWithWarnings,
  });

  return { summary, mappings, rows: validatedRows };
}

// ─── Confirm ─────────────────────────────────────────────────────────────────

export async function confirmMemberImport(
  ctx: RequestContext,
  rows: ValidatedImportRow[],
  fileName: string = "import.csv",
): Promise<ImportConfirmResponse> {
  assertCan(ctx.user, "member.import");

  let created = 0;
  let updated = 0;
  let ignored = 0;
  let alertsCreated = 0;
  let tasksCreated = 0;

  const now = new Date();

  for (const row of rows) {
    // Nunca importar filas con error
    if (row.action === "error" || row.action === "skipped") {
      ignored++;
      continue;
    }

    // Calcular onboardingDay desde joinDate
    const joinDate = new Date(row.joinDate);
    const onboardingDay = Math.max(
      0,
      Math.floor((now.getTime() - joinDate.getTime()) / 86_400_000),
    );

    const memberData = {
      fullName: row.fullName,
      email: row.email ?? "",
      phone: row.phone ?? "",
      joinDate: row.joinDate,
      onboardingDay,
      mainGoal: row.mainGoal ?? "",
      level: row.level,
      assignedCoachId: row.assignedCoachId,
      limitations: row.limitations,
      fears: null,
      acquisitionSource: row.acquisitionSource ?? "Importación CSV",
      lastAttendanceAt: row.lastAttendanceAt,
      nextRecommendedAction: row.assignedCoachId ? "Enviar bienvenida" : "Asignar coach",
      activationScore: 0,
      riskLevel: "low" as const,
      riskReason: null,
    };

    if (row.action === "update" && row.existingMemberId) {
      // Actualizar socio existente
      await memberRepository.update(ctx.organizationId, row.existingMemberId, {
        ...memberData,
        status: row.assignedCoachId ? "in_progress" : "no_coach",
      });
      await auditRepository.record(ctx.organizationId, ctx.user.id, "Member", row.existingMemberId, "updated", { source: "csv_import" });
      updated++;
    } else {
      // Crear socio nuevo
      const status = row.assignedCoachId ? "in_progress" : "no_coach";
      const member = await memberRepository.create(ctx.organizationId, {
        ...memberData,
        status,
      });
      await auditRepository.record(ctx.organizationId, ctx.user.id, "Member", member.id, "created", { source: "csv_import" });

      // Calcular activation score y riesgo
      try {
        const mCtx = await buildMemberContext(ctx.organizationId, member.id);
        const scoreResult = computeActivationScore(mCtx);
        const riskResult = evaluateRisk(mCtx);
        const stateResult = deriveStatus(mCtx);

        await prisma.member.update({
          where: { id: member.id },
          data: {
            activationScore: scoreResult.score,
            status: stateResult.status,
            riskLevel: riskResult.topRisk,
          },
        });

        // Crear alertas de riesgo si aplica (sin duplicar)
        for (const finding of riskResult.findings) {
          const ruleKey = `${ctx.organizationId}:${finding.rule}:${member.id}`;
          const existing = await alertRepository.findOpenByRuleKey(ctx.organizationId, ruleKey);
          if (!existing) {
            await alertRepository.create(ctx.organizationId, {
              memberId: member.id,
              riskLevel: finding.riskLevel,
              reason: finding.reason,
              daysSinceLastAttendance: null,
              suggestedAction: finding.suggestedAction,
              suggestedMessage: null,
              priority: finding.riskLevel === "high" ? "high" : "medium",
              status: "open",
              resolvedAt: null, resolvedNote: null, snoozeUntil: null,
              ruleKey,
            });
            alertsCreated++;
          }
        }

        // Crear tarea si no tiene coach
        if (!row.assignedCoachId) {
          const taskKey = `${ctx.organizationId}:no_coach:${member.id}`;
          const existingTask = await taskRepository.findOpenByRuleKey(ctx.organizationId, taskKey);
          if (!existingTask) {
            await taskRepository.create(ctx.organizationId, {
              memberId: member.id, assignedToUserId: null,
              title: `Asignar coach a ${member.fullName}`,
              description: "Socio importado sin coach asignado.",
              priority: "high", status: "today",
              dueDate: now.toISOString(), completedAt: null, ruleKey: taskKey,
            });
            tasksCreated++;
          }
        }
      } catch {
        // Si falla el cálculo de insights, el socio ya se creó — no es crítico
      }

      created++;
    }
  }

  // Audit log agregado de la importación
  await auditRepository.record(
    ctx.organizationId,
    ctx.user.id,
    "member_import",
    ctx.organizationId,
    "members.imported",
    {
      fileName,
      totalRows: rows.length,
      created,
      updated,
      ignored,
      errors: rows.filter((r) => r.action === "error").length,
      warnings: rows.filter((r) => r.warnings.length > 0).length,
    },
  );

  trackServerEvent("member_import_confirmed", ctx, {
    fileName,
    totalRows: rows.length,
    created,
    updated,
    ignored,
    errors: rows.filter((r) => r.action === "error").length,
    warnings: rows.filter((r) => r.warnings.length > 0).length,
  });

  return { created, updated, ignored, alertsCreated, tasksCreated };
}
