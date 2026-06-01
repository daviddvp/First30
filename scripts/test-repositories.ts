// ─────────────────────────────────────────────────────────────────────────────
// First30 — Tests de repositorios Prisma
// Ejecutar con: MOCK_AUTH=false npx tsx scripts/test-repositories.ts
// Requiere DATABASE_URL configurada y prisma migrate dev ejecutado.
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaClient } from "@prisma/client";
import { memberRepository } from "../src/server/repositories/member.repository";
import { taskRepository } from "../src/server/repositories/task.repository";
import { alertRepository } from "../src/server/repositories/alert.repository";
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

async function run() {
  console.log("\n🔬 Test Suite: Repositorios Prisma\n");

  // ── Verificar que hay datos en la DB ─────────────────────────────────────
  const orgCount = await prisma.organization.count();
  if (orgCount === 0) {
    console.error("❌ No hay datos en la DB. Ejecuta: npm run db:seed");
    process.exit(1);
  }
  console.log(`  ℹ️  ${orgCount} organizaciones en DB`);

  const ORG_A = "org_centro";
  const ORG_B = "org_norte";

  // ── 1. Aislamiento multi-tenant: members ─────────────────────────────────
  console.log("\n1. Aislamiento multi-tenant — memberRepository");

  const membersA = await memberRepository.list(ORG_A);
  const membersB = await memberRepository.list(ORG_B);

  assert(membersA.length > 0, "Org A tiene socios");
  assert(membersB.length > 0, "Org B tiene socios");
  assert(
    membersA.every((m) => m.organizationId === ORG_A),
    "Todos los socios de list(ORG_A) tienen organizationId = ORG_A",
    `Encontrado: ${membersA.find((m) => m.organizationId !== ORG_A)?.organizationId}`
  );
  assert(
    membersB.every((m) => m.organizationId === ORG_B),
    "Todos los socios de list(ORG_B) tienen organizationId = ORG_B"
  );
  assert(
    !membersA.some((m) => membersB.some((b) => b.id === m.id)),
    "No hay socios compartidos entre orgs"
  );

  // Verificar que findById con org incorrecta devuelve undefined
  const marta = await memberRepository.findById(ORG_A, "mbr_marta");
  assert(marta !== undefined, "findById(ORG_A, 'mbr_marta') encuentra el socio");
  const martaWrong = await memberRepository.findById(ORG_B, "mbr_marta");
  assert(martaWrong === undefined, "findById(ORG_B, 'mbr_marta') no encuentra socio de otra org");

  // ── 2. Aislamiento multi-tenant: tasks ───────────────────────────────────
  console.log("\n2. Aislamiento multi-tenant — taskRepository");

  const tasksA = await taskRepository.list(ORG_A);
  const tasksB = await taskRepository.list(ORG_B);

  assert(
    tasksA.every((t) => t.organizationId === ORG_A),
    "Todas las tareas de list(ORG_A) tienen organizationId = ORG_A"
  );
  assert(
    tasksB.every((t) => t.organizationId === ORG_B),
    "Todas las tareas de list(ORG_B) tienen organizationId = ORG_B"
  );
  assert(
    !tasksA.some((t) => tasksB.some((b) => b.id === t.id)),
    "No hay tareas compartidas entre orgs"
  );

  // findById con org incorrecta
  const tsk1 = await taskRepository.findById(ORG_A, "tsk_01");
  assert(tsk1 !== undefined, "findById(ORG_A, 'tsk_01') encuentra la tarea");
  const tsk1Wrong = await taskRepository.findById(ORG_B, "tsk_01");
  assert(tsk1Wrong === undefined, "findById(ORG_B, 'tsk_01') no encuentra tarea de otra org");

  // ── 3. Aislamiento multi-tenant: alerts ──────────────────────────────────
  console.log("\n3. Aislamiento multi-tenant — alertRepository");

  const alertsA = await alertRepository.list(ORG_A);
  const alertsB = await alertRepository.list(ORG_B);

  assert(
    alertsA.every((a) => a.organizationId === ORG_A),
    "Todas las alertas de list(ORG_A) tienen organizationId = ORG_A"
  );
  assert(
    alertsB.every((a) => a.organizationId === ORG_B),
    "Todas las alertas de list(ORG_B) tienen organizationId = ORG_B"
  );

  // ── 4. completedAt en tareas completadas ─────────────────────────────────
  console.log("\n4. Coherencia de datos — completedAt");

  const completedTasks = await taskRepository.list(ORG_A, { status: "completed" });
  assert(completedTasks.length > 0, "Hay tareas completadas en ORG_A");
  assert(
    completedTasks.every((t) => t.completedAt !== null),
    "Todas las tareas completed tienen completedAt",
    `Sin completedAt: ${completedTasks.find((t) => !t.completedAt)?.id}`
  );

  const pendingTasks = await taskRepository.list(ORG_A, { status: "pending" });
  assert(
    pendingTasks.every((t) => t.completedAt === null),
    "Tareas pending no tienen completedAt"
  );

  // ── 5. resolvedAt en alertas resueltas ───────────────────────────────────
  console.log("\n5. Coherencia de datos — resolvedAt");

  const resolvedAlerts = await alertRepository.list(ORG_A, { status: "resolved" });
  assert(resolvedAlerts.length > 0, "Hay alertas resueltas en ORG_A");
  assert(
    resolvedAlerts.every((a) => a.resolvedAt !== null),
    "Todas las alertas resolved tienen resolvedAt"
  );

  // ── 6. Audit log — record y list ─────────────────────────────────────────
  console.log("\n6. auditRepository");

  await auditRepository.record(ORG_A, "usr_a_owner", "Test", "test-entity-1", "created", { test: true });
  const logs = await auditRepository.list(ORG_A, 5);
  assert(logs.length > 0, "auditRepository.list devuelve eventos");
  assert(
    logs.every((l) => l.organizationId === ORG_A),
    "Todos los audit logs son de ORG_A"
  );
  const logsB = await auditRepository.list(ORG_B, 5);
  assert(
    logsB.every((l) => l.organizationId === ORG_B),
    "auditRepository.list(ORG_B) no devuelve logs de ORG_A"
  );

  // ── 7. ruleKey deduplicación ─────────────────────────────────────────────
  console.log("\n7. Deduplicación por ruleKey");

  const testRuleKey = `${ORG_A}:test:mbr_marta`;
  // Crear tarea con ruleKey
  const t = await taskRepository.create(ORG_A, {
    memberId: "mbr_marta", assignedToUserId: null,
    title: "Tarea de test dedup", description: null,
    priority: "medium", status: "pending", dueDate: null, completedAt: null, ruleKey: testRuleKey,
  });
  const found = await taskRepository.findOpenByRuleKey(ORG_A, testRuleKey);
  assert(found !== undefined, "findOpenByRuleKey encuentra la tarea recién creada");
  assert(found?.id === t.id, "La tarea encontrada es la correcta");
  // No encuentra en otra org
  const notFound = await taskRepository.findOpenByRuleKey(ORG_B, testRuleKey);
  assert(notFound === undefined, "findOpenByRuleKey no cruza orgs");
  // Limpiar
  await prisma.task.delete({ where: { id: t.id } });

  // ── 8. Filtros de visibilidad coach ─────────────────────────────────────
  console.log("\n8. Filtros de visibilidad — coach scope");

  const cph_a2_members = await memberRepository.list(ORG_A, { coachId: "cph_a2" });
  assert(cph_a2_members.length > 0, "Hay socios asignados a cph_a2");
  assert(
    cph_a2_members.every((m) => m.assignedCoachId === "cph_a2"),
    "Todos los socios filtrados por coachId=cph_a2 tienen ese coachId"
  );

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Resultado: ${passed} ✅  |  ${failed} ❌`);
  if (failed > 0) {
    console.error(`\n⚠️  ${failed} test(s) fallaron.`);
    process.exit(1);
  } else {
    console.log("\n🎉 Todos los tests de repositorios pasaron.");
  }
}

run()
  .catch((e) => { console.error("Error inesperado:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
