// POST /api/jobs/run-onboarding-rules
// Ejecuta el job de reglas para todas las organizaciones activas.
// Protegido con JOB_SECRET. Ejecutar manualmente o desde un cron externo.
//
// Ejemplo de llamada:
//   curl -X POST http://localhost:3000/api/jobs/run-onboarding-rules \
//     -H "Authorization: Bearer $JOB_SECRET"
//
// Vercel Cron (vercel.json):
//   { "crons": [{ "path": "/api/jobs/run-onboarding-rules", "schedule": "0 8 * * *" }] }
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyJobSecret } from "@/lib/job-auth";
import { runOnboardingRulesJob } from "@/server/jobs/run-onboarding-rules.job";
import { prisma } from "@/lib/db";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";
// Aumentar el timeout de la ruta (para orgs con muchos socios)
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    verifyJobSecret(req.headers.get("authorization"));
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Si se pasa ?orgId=xxx, procesar solo esa organización
  const specificOrg = req.nextUrl.searchParams.get("orgId");

  try {
    const orgIds = specificOrg
      ? [specificOrg]
      : (await prisma.organization.findMany({ select: { id: true } })).map((o) => o.id);

    const results = await Promise.all(orgIds.map((orgId) => runOnboardingRulesJob(orgId)));

    const summary = {
      orgsProcessed: results.length,
      totalMembersProcessed: results.reduce((s, r) => s + r.membersProcessed, 0),
      totalAlertsCreated:    results.reduce((s, r) => s + r.alertsCreated, 0),
      totalTasksCreated:     results.reduce((s, r) => s + r.tasksCreated, 0),
      totalScoresUpdated:    results.reduce((s, r) => s + r.scoresUpdated, 0),
      totalErrors:           results.reduce((s, r) => s + r.errors.length, 0),
      results,
      executedAt: new Date().toISOString(),
    };

    const status = summary.totalErrors > 0 ? 207 : 200;
    return NextResponse.json({ data: summary, error: null }, { status });

  } catch (err) {
    console.error("[First30] Job error:", err);
    return NextResponse.json(
      { data: null, error: { code: "DATABASE_ERROR", message: "Error ejecutando el job" } },
      { status: 500 }
    );
  }
}
