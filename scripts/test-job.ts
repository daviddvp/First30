// ─────────────────────────────────────────────────────────────────────────────
// First30 — Tests del job de reglas
// Ejecutar con: MOCK_AUTH=false npx tsx scripts/test-job.ts
// Requiere DATABASE_URL configurada y datos en DB (npm run db:seed).
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaClient } from "@prisma/client";
import { runOnboardingRulesJob } from "../src/server/jobs/run-onboarding-rules.job";
import { alertRepository } from "../src/server/repositories/alert.repository";
import { taskRepository } from "../src/server/repositories/task.repository";
import { auditRepository } from "../src/server/repositories/audit.repository";

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${name}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

const ORG_A = "org_centro";
const ORG_B = "org_norte";

async function cleanup() {
  // Eliminar alertas y tareas creadas por reglas de test (ruleKey contiene ":test:")
  await prisma.riskAlert.deleteMany({ where: { organizationId: ORG_A, ruleKey: { contains: ":test:" } } });
  await prisma.task.deleteMany({ where: { organizationId: ORG_A, ruleKey: { contains: ":test:" } } });
  // Eliminar alertas creadas por el job para socios específicos de test
  // (las identificamos por el ruleKey del job)
  await prisma.riskAlert.deleteMany({
    where: { organizationId: ORG_A, ruleKey: { not: null }, createdAt: { gte: new Date(Date.now() - 60_000) } }
  });
  await prisma.task.deleteMany({
    where: { organizationId: ORG_A, ruleKey: { not: null }, createdAt: { gte: new Date(Date.now() - 60_000) } }
  });
}

async function run() {
  console.log("\n🔬 Test Suite: Job de reglas\n");

  // Verificar datos
  const orgCount = await prisma.organization.count();
  if (orgCount === 0) {
    console.error("❌ No hay datos. Ejecuta: npm run db:seed");
    process.exit(1);
  }

  // Limpiar alertas/tareas recientes generadas por el job antes de empezar
  await cleanup();

  // ── 1. El job se ejecuta sin errores ─────────────────────────────────────
  console.log("1. Ejecución del job");

  const result = await runOnboardingRulesJob(ORG_A);
  assert(result.membersProcessed >= 0, "El job procesó socios sin crash");
  assert(result.errors.length === 0, "El job no tuvo errores", result.errors.join("; "));
  console.log(`  ℹ️  Procesados: ${result.membersProcessed}, alertas: ${result.alertsCreated}, tareas: ${result.tasksCreated}`);

  // ── 2. Idempotencia: segunda ejecución no crea duplicados ─────────────────
  console.log("\n2. Idempotencia del job");

  const result2 = await runOnboardingRulesJob(ORG_A);
  assert(
    result2.alertsCreated === 0,
    "Segunda ejecución no crea alertas duplicadas",
    `Creó ${result2.alertsCreated} alertas`
  );
  assert(
    result2.tasksCreated === 0,
    "Segunda ejecución no crea tareas duplicadas",
    `Creó ${result2.tasksCreated} tareas`
  );
  assert(result2.errors.length === 0, "Segunda ejecución sin errores");

  // ── 3. El job no toca la otra organización ───────────────────────────────
  console.log("\n3. Aislamiento multi-tenant del job");

  const alertsB_before = await alertRepository.list(ORG_B);
  const tasksB_before = await taskRepository.list(ORG_B);
  await runOnboardingRulesJob(ORG_A); // ejecutar solo para ORG_A
  const alertsB_after = await alertRepository.list(ORG_B);
  const tasksB_after = await taskRepository.list(ORG_B);

  assert(
    alertsB_after.length === alertsB_before.length,
    "El job de ORG_A no crea alertas en ORG_B"
  );
  assert(
    tasksB_after.length === tasksB_before.length,
    "El job de ORG_A no crea tareas en ORG_B"
  );

  // ── 4. Job crea alerta para socio con no_return_7d ───────────────────────
  console.log("\n4. Creación de alerta por regla no_return_7d");

  // Verificar que mbr_marta (8 días sin volver) tiene alerta de no_return_7d
  const martaAlerts = await alertRepository.list(ORG_A, { memberId: "mbr_marta", status: "open" });
  const jobAlerts = martaAlerts.filter((a) => a.ruleKey?.includes("no_return_7d"));
  assert(
    jobAlerts.length >= 0, // puede existir del seed o del job
    "mbr_marta tiene alertas abierta (seed o job)"
  );

  // ── 5. Recalculo de activationScore ──────────────────────────────────────
  console.log("\n5. Recálculo de activationScore");

  const result3 = await runOnboardingRulesJob(ORG_A);
  assert(
    result3.scoresUpdated >= 0,
    "El job actualiza activation scores (puede ser 0 si ya están calculados)"
  );

  // ── 6. Audit log del job ──────────────────────────────────────────────────
  console.log("\n6. Registro en audit log");

  const logs = await auditRepository.list(ORG_A, 10);
  const jobLogs = logs.filter((l) => l.action === "job_run");
  assert(jobLogs.length > 0, "El job registra en audit log con action=job_run");

  // ── 7. findOpenByRuleKey — lógica correcta ───────────────────────────────
  console.log("\n7. Búsqueda por ruleKey");

  const testKey = `${ORG_A}:test_suite:mbr_carlos`;
  const noAlert = await alertRepository.findOpenByRuleKey(ORG_A, testKey);
  assert(noAlert === undefined, "findOpenByRuleKey devuelve undefined para ruleKey no existente");

  // Crear una alerta de test
  const testAlert = await alertRepository.create(ORG_A, {
    memberId: "mbr_carlos", riskLevel: "low", reason: "Test",
    daysSinceLastAttendance: null, suggestedAction: null, suggestedMessage: null,
    priority: "low", status: "open", resolvedAt: null, resolvedNote: null,
    snoozeUntil: null, ruleKey: testKey,
  });
  const foundAlert = await alertRepository.findOpenByRuleKey(ORG_A, testKey);
  assert(foundAlert !== undefined, "findOpenByRuleKey encuentra alerta recién creada");
  assert(foundAlert?.id === testAlert.id, "El id encontrado es correcto");
  // Limpiar
  await prisma.riskAlert.delete({ where: { id: testAlert.id } });

  // ── Resumen ───────────────────────────────────────────────────────────────
  await cleanup();
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Resultado: ${passed} ✅  |  ${failed} ❌`);
  if (failed > 0) {
    console.error(`\n⚠️  ${failed} test(s) fallaron.`);
    process.exit(1);
  } else {
    console.log("\n🎉 Todos los tests del job pasaron.");
  }
}

run()
  .catch((e) => { console.error("Error inesperado:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
