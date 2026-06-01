// ─────────────────────────────────────────────────────────────────────────────
// First30 — Prisma seed coherente (espejo del seed mock, adaptado a Prisma).
// Mantiene los mismos IDs y datos que src/data/seed.ts para compatibilidad
// con tests y scripts existentes.
// ─────────────────────────────────────────────────────────────────────────────
import { PrismaClient, UserRole, MemberStatus, RiskLevel, MemberLevel,
  Priority, TaskStatus, CheckInStatus, AlertStatus, MessageChannel,
  MessageStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Fecha fija equivalente al NOW de src/lib/date.ts
const NOW = new Date("2026-05-30T09:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const daysAhead = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

const ORG_A = "org_centro";
const ORG_B = "org_norte";

async function main() {
  console.log("🌱 Seeding First30...");

  // ── 1. Limpiar (orden inverso a foreign keys) ─────────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.messageLog.deleteMany();
  await prisma.messageTemplate.deleteMany();
  await prisma.riskAlert.deleteMany();
  await prisma.task.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.note.deleteMany();
  await prisma.orgSettings.deleteMany();
  await prisma.onboardingRule.deleteMany();
  await prisma.weeklyReport.deleteMany();
  await prisma.member.deleteMany();
  await prisma.coachProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  console.log("  ✓ Tablas limpiadas");

  // ── 2. Organizaciones ─────────────────────────────────────────────────────
  await prisma.organization.createMany({
    data: [
      { id: ORG_A, name: "CrossBox Centro", slug: "crossbox-centro",
        timezone: "Europe/Madrid", brandingColor: "#1f7a4d",
        createdAt: daysAgo(420), updatedAt: NOW },
      { id: ORG_B, name: "Box Norte Strength", slug: "box-norte",
        timezone: "Europe/Madrid", brandingColor: "#d97706",
        createdAt: daysAgo(300), updatedAt: NOW },
    ],
  });
  console.log("  ✓ 2 organizaciones");

  // ── 3. OrgSettings ────────────────────────────────────────────────────────
  await prisma.orgSettings.createMany({
    data: [
      { organizationId: ORG_A, riskNoReturnDays: 7, riskLowAttendanceDays: 14,
        riskLowAttendanceMin: 2, notificationsEnabled: true,
        reminderDays: [7, 14, 21, 30], timezone: "Europe/Madrid" },
      { organizationId: ORG_B, riskNoReturnDays: 7, riskLowAttendanceDays: 14,
        riskLowAttendanceMin: 2, notificationsEnabled: true,
        reminderDays: [7, 14, 21, 30], timezone: "Europe/Madrid" },
    ],
  });
  console.log("  ✓ 2 org settings");

  // ── 4. Users ──────────────────────────────────────────────────────────────
  await prisma.user.createMany({
    data: [
      // Org A
      { id: "usr_a_owner", organizationId: ORG_A, name: "Carla Núñez",
        email: "carla@crossboxcentro.es", role: UserRole.owner,
        createdAt: daysAgo(420), updatedAt: NOW },
      { id: "usr_a_mgr", organizationId: ORG_A, name: "Marcos Ferrer",
        email: "marcos@crossboxcentro.es", role: UserRole.manager,
        createdAt: daysAgo(380), updatedAt: NOW },
      { id: "usr_a_c1", organizationId: ORG_A, name: "Sergio Romero",
        email: "sergio@crossboxcentro.es", role: UserRole.coach,
        createdAt: daysAgo(360), updatedAt: NOW },
      { id: "usr_a_c2", organizationId: ORG_A, name: "Elena Marín",
        email: "elena@crossboxcentro.es", role: UserRole.coach,
        createdAt: daysAgo(350), updatedAt: NOW },
      { id: "usr_a_c3", organizationId: ORG_A, name: "Pablo Costa",
        email: "pablo@crossboxcentro.es", role: UserRole.coach,
        createdAt: daysAgo(340), updatedAt: NOW },
      { id: "usr_a_c4", organizationId: ORG_A, name: "Lucas Prieto",
        email: "lucas@crossboxcentro.es", role: UserRole.coach,
        createdAt: daysAgo(120), updatedAt: NOW },
      // Org B
      { id: "usr_b_owner", organizationId: ORG_B, name: "Laia Vives",
        email: "laia@boxnorte.es", role: UserRole.owner,
        createdAt: daysAgo(300), updatedAt: NOW },
      { id: "usr_b_mgr", organizationId: ORG_B, name: "Bruno Castro",
        email: "bruno@boxnorte.es", role: UserRole.manager,
        createdAt: daysAgo(280), updatedAt: NOW },
      { id: "usr_b_c1", organizationId: ORG_B, name: "Noa Sanz",
        email: "noa@boxnorte.es", role: UserRole.coach,
        createdAt: daysAgo(270), updatedAt: NOW },
      { id: "usr_b_c2", organizationId: ORG_B, name: "Iván Mora",
        email: "ivan@boxnorte.es", role: UserRole.coach,
        createdAt: daysAgo(200), updatedAt: NOW },
    ],
  });
  console.log("  ✓ 10 usuarios");

  // ── 5. CoachProfiles ──────────────────────────────────────────────────────
  await prisma.coachProfile.createMany({
    data: [
      { id: "cph_a1", userId: "usr_a_c1", organizationId: ORG_A,
        specialties: ["Halterofilia", "Fuerza"], maxActiveNewMembers: 8,
        active: true, createdAt: daysAgo(360), updatedAt: NOW },
      { id: "cph_a2", userId: "usr_a_c2", organizationId: ORG_A,
        specialties: ["Onboarding", "Movilidad"], maxActiveNewMembers: 6,
        active: true, createdAt: daysAgo(350), updatedAt: NOW },
      { id: "cph_a3", userId: "usr_a_c3", organizationId: ORG_A,
        specialties: ["Competición", "Gimnásticos"], maxActiveNewMembers: 7,
        active: true, createdAt: daysAgo(340), updatedAt: NOW },
      { id: "cph_a4", userId: "usr_a_c4", organizationId: ORG_A,
        specialties: ["HIIT", "Acondicionamiento"], maxActiveNewMembers: 5,
        active: true, createdAt: daysAgo(120), updatedAt: NOW },
      { id: "cph_b1", userId: "usr_b_c1", organizationId: ORG_B,
        specialties: ["Fuerza", "Powerlifting"], maxActiveNewMembers: 8,
        active: true, createdAt: daysAgo(270), updatedAt: NOW },
      { id: "cph_b2", userId: "usr_b_c2", organizationId: ORG_B,
        specialties: ["Functional", "HIIT"], maxActiveNewMembers: 6,
        active: true, createdAt: daysAgo(200), updatedAt: NOW },
    ],
  });
  console.log("  ✓ 6 coach profiles");

  // ── 6. Members (20) ───────────────────────────────────────────────────────
  type MSpec = {
    id: string; org: string; name: string; goal: string; day: number;
    status: MemberStatus; risk: RiskLevel; reason: string | null;
    level: MemberLevel; coach: string | null;
    limitations: string | null; fears: string | null;
    source: string; score: number; gap: number; atts: number; next: string;
  };

  const memberSpecs: MSpec[] = [
    // Org A (14 socios, con los 5 obligatorios)
    { id: "mbr_marta", org: ORG_A, name: "Marta García", goal: "Perder peso", day: 8,
      status: MemberStatus.at_risk, risk: RiskLevel.high, reason: "No volvió tras la primera clase",
      level: MemberLevel.beginner, coach: "cph_a2", limitations: null,
      fears: "Le preocupa no seguir el ritmo del resto", source: "Instagram", score: 18, gap: 8, atts: 1, next: "Contactar — no ha vuelto" },
    { id: "mbr_david", org: ORG_A, name: "David López", goal: "Ganar fuerza", day: 3,
      status: MemberStatus.no_coach, risk: RiskLevel.medium, reason: "Sin coach asignado",
      level: MemberLevel.intermediate, coach: null, limitations: "Molestia leve en hombro derecho",
      fears: null, source: "Recomendación", score: 35, gap: 1, atts: 2, next: "Asignar coach" },
    { id: "mbr_laura", org: ORG_A, name: "Laura Sánchez", goal: "Salud general", day: 14,
      status: MemberStatus.in_progress, risk: RiskLevel.low, reason: null,
      level: MemberLevel.beginner, coach: "cph_a1", limitations: null,
      fears: "Constancia: viene de varios intentos", source: "Web", score: 58, gap: 3, atts: 4, next: "Revisión de hábito día 14" },
    { id: "mbr_carlos", org: ORG_A, name: "Carlos Martín", goal: "Competir", day: 30,
      status: MemberStatus.activated, risk: RiskLevel.low, reason: null,
      level: MemberLevel.advanced, coach: "cph_a3", limitations: null,
      fears: null, source: "Web", score: 88, gap: 1, atts: 8, next: "Enviar resumen día 30" },
    { id: "mbr_ana", org: ORG_A, name: "Ana Ruiz", goal: "Volver al deporte", day: 21,
      status: MemberStatus.at_risk, risk: RiskLevel.medium, reason: "Solo 1 asistencia en los últimos 14 días",
      level: MemberLevel.beginner, coach: "cph_a1", limitations: "Vuelve de lesión de rodilla",
      fears: "Miedo a recaer en la lesión", source: "Recomendación", score: 30, gap: 9, atts: 3, next: "Revisar escalados" },
    { id: "mbr_roberto", org: ORG_A, name: "Roberto Díaz", goal: "Salud general", day: 30,
      status: MemberStatus.completed, risk: RiskLevel.low, reason: null,
      level: MemberLevel.intermediate, coach: "cph_a1", limitations: null,
      fears: null, source: "Recomendación", score: 90, gap: 2, atts: 7, next: "Onboarding completado" },
    { id: "mbr_javier", org: ORG_A, name: "Javier Soler", goal: "Ganar masa muscular", day: 5,
      status: MemberStatus.in_progress, risk: RiskLevel.low, reason: null,
      level: MemberLevel.intermediate, coach: "cph_a3", limitations: null,
      fears: null, source: "Instagram", score: 55, gap: 2, atts: 2, next: "Recomendar próxima clase" },
    { id: "mbr_nuria", org: ORG_A, name: "Nuria Pons", goal: "Perder peso", day: 2,
      status: MemberStatus.in_progress, risk: RiskLevel.low, reason: null,
      level: MemberLevel.beginner, coach: "cph_a2", limitations: null,
      fears: "Primera vez en un box, le impone", source: "Web", score: 48, gap: 0, atts: 1, next: "Mensaje post primera clase" },
    { id: "mbr_lucia", org: ORG_A, name: "Lucía Romero", goal: "Tonificar", day: 10,
      status: MemberStatus.in_progress, risk: RiskLevel.low, reason: null,
      level: MemberLevel.beginner, coach: "cph_a4", limitations: null,
      fears: null, source: "Instagram", score: 60, gap: 3, atts: 2, next: "Check-in semanal" },
    { id: "mbr_pablog", org: ORG_A, name: "Pablo Gil", goal: "Perder peso", day: 16,
      status: MemberStatus.churned, risk: RiskLevel.low, reason: "Dejó de venir tras la 2ª semana",
      level: MemberLevel.beginner, coach: "cph_a4", limitations: null,
      fears: null, source: "Web", score: 12, gap: 14, atts: 0, next: "Intentar reactivación" },
    { id: "mbr_sara", org: ORG_A, name: "Sara Vidal", goal: "Salud general", day: 6,
      status: MemberStatus.in_progress, risk: RiskLevel.low, reason: null,
      level: MemberLevel.beginner, coach: "cph_a2", limitations: null,
      fears: null, source: "Recomendación", score: 50, gap: 4, atts: 1, next: "Recomendar 2ª visita" },
    { id: "mbr_hugo", org: ORG_A, name: "Hugo Marín", goal: "Ganar fuerza", day: 25,
      status: MemberStatus.activated, risk: RiskLevel.low, reason: null,
      level: MemberLevel.intermediate, coach: "cph_a3", limitations: null,
      fears: null, source: "Web", score: 80, gap: 1, atts: 3, next: "Mantener ritmo 3 días/sem" },
    { id: "mbr_elenat", org: ORG_A, name: "Elena Torres", goal: "Volver al deporte", day: 12,
      status: MemberStatus.in_progress, risk: RiskLevel.low, reason: null,
      level: MemberLevel.beginner, coach: "cph_a4", limitations: null,
      fears: null, source: "Instagram", score: 57, gap: 2, atts: 2, next: "Check-in día 14" },
    { id: "mbr_diego", org: ORG_A, name: "Diego Navarro", goal: "Competir", day: 4,
      status: MemberStatus.in_progress, risk: RiskLevel.low, reason: null,
      level: MemberLevel.advanced, coach: "cph_a1", limitations: null,
      fears: null, source: "Recomendación", score: 52, gap: 1, atts: 1, next: "Recomendar clase de técnica" },
    // Org B (6 socios)
    { id: "mbr_aitor", org: ORG_B, name: "Aitor Ruano", goal: "Ganar fuerza", day: 8,
      status: MemberStatus.in_progress, risk: RiskLevel.low, reason: null,
      level: MemberLevel.intermediate, coach: "cph_b1", limitations: null,
      fears: null, source: "Web", score: 56, gap: 3, atts: 1, next: "Recomendar próxima clase" },
    { id: "mbr_clara", org: ORG_B, name: "Clara Vega", goal: "Competir", day: 29,
      status: MemberStatus.activated, risk: RiskLevel.low, reason: null,
      level: MemberLevel.advanced, coach: "cph_b2", limitations: null,
      fears: null, source: "Instagram", score: 82, gap: 2, atts: 1, next: "Preparar resumen día 30" },
    { id: "mbr_marc", org: ORG_B, name: "Marc Soler", goal: "Perder peso", day: 11,
      status: MemberStatus.at_risk, risk: RiskLevel.medium, reason: "Canceló dos clases seguidas",
      level: MemberLevel.beginner, coach: "cph_b1", limitations: null,
      fears: "Horario complicado", source: "Recomendación", score: 28, gap: 8, atts: 0, next: "Llamar y ofrecer horario fijo" },
    { id: "mbr_irene", org: ORG_B, name: "Irene Lago", goal: "Salud general", day: 5,
      status: MemberStatus.in_progress, risk: RiskLevel.low, reason: null,
      level: MemberLevel.beginner, coach: "cph_b2", limitations: null,
      fears: null, source: "Web", score: 49, gap: 2, atts: 1, next: "Mensaje post primera clase" },
    { id: "mbr_pau", org: ORG_B, name: "Pau Esteve", goal: "Volver al deporte", day: 19,
      status: MemberStatus.churned, risk: RiskLevel.low, reason: "No respondió a los check-ins",
      level: MemberLevel.intermediate, coach: "cph_b1", limitations: null,
      fears: null, source: "Instagram", score: 15, gap: 16, atts: 0, next: "Reactivación suave" },
    { id: "mbr_rosa", org: ORG_B, name: "Rosa Camps", goal: "Tonificar", day: 3,
      status: MemberStatus.in_progress, risk: RiskLevel.low, reason: null,
      level: MemberLevel.beginner, coach: "cph_b2", limitations: null,
      fears: null, source: "Recomendación", score: 47, gap: 1, atts: 0, next: "Enviar bienvenida" },
  ];

  // ── 6a. Crear socios y calcular lastAttendanceAt ───────────────────────────
  const attendancesToCreate: Array<{
    id: string; organizationId: string; memberId: string; classDate: Date;
    classType: string; coachId: string; notes: null; createdAt: Date;
  }> = [];

  const CLASS_TYPES = ["WOD", "Halterofilia", "Iniciación", "HIIT", "Open Box", "Fuerza"];
  let attSeq = 0;

  for (const spec of memberSpecs) {
    const classCoach = spec.coach ?? (spec.org === ORG_A ? "cph_a1" : "cph_b1");
    let lastAt: Date | null = null;

    if (spec.atts > 0) {
      const first = Math.max(spec.day - 1, spec.gap);
      for (let i = 0; i < spec.atts; i++) {
        const offset = spec.atts === 1 ? spec.gap
          : Math.round(first - ((first - spec.gap) * i) / (spec.atts - 1));
        const classDate = daysAgo(offset);
        attSeq++;
        attendancesToCreate.push({
          id: `att_${String(attSeq).padStart(3, "0")}`,
          organizationId: spec.org, memberId: spec.id,
          classDate, classType: CLASS_TYPES[(attSeq + spec.day) % CLASS_TYPES.length],
          coachId: classCoach, notes: null, createdAt: classDate,
        });
        lastAt = classDate;
      }
    }

    await prisma.member.create({
      data: {
        id: spec.id, organizationId: spec.org, fullName: spec.name,
        email: `${spec.id.replace("mbr_", "")}@example.com`,
        phone: "+34 6XX XXX XXX",
        joinDate: daysAgo(spec.day), onboardingDay: spec.day,
        status: spec.status, riskLevel: spec.risk, riskReason: spec.reason,
        mainGoal: spec.goal, level: spec.level,
        limitations: spec.limitations, fears: spec.fears,
        acquisitionSource: spec.source,
        assignedCoachId: spec.coach,
        lastAttendanceAt: lastAt,
        nextRecommendedAction: spec.next,
        activationScore: spec.score,
        createdAt: daysAgo(spec.day), updatedAt: NOW,
      },
    });
  }
  console.log("  ✓ 20 socios");

  // ── 7. Attendances (40) ───────────────────────────────────────────────────
  await prisma.attendance.createMany({ data: attendancesToCreate });
  console.log(`  ✓ ${attendancesToCreate.length} asistencias`);

  // ── 8. CheckIns (8) ───────────────────────────────────────────────────────
  await prisma.checkIn.createMany({
    data: [
      { id: "chk_01", organizationId: ORG_A, memberId: "mbr_marta", coachId: "cph_a2",
        day: 3, status: CheckInStatus.missed, sentiment: null,
        notes: "No respondió al primer check-in", createdAt: daysAgo(4) },
      { id: "chk_02", organizationId: ORG_A, memberId: "mbr_laura", coachId: "cph_a1",
        day: 7, status: CheckInStatus.responded, sentiment: "positive",
        notes: "Contenta con la progresión", createdAt: daysAgo(7) },
      { id: "chk_03", organizationId: ORG_A, memberId: "mbr_ana", coachId: "cph_a1",
        day: 14, status: CheckInStatus.missed, sentiment: null,
        notes: null, createdAt: daysAgo(7) },
      { id: "chk_04", organizationId: ORG_A, memberId: "mbr_carlos", coachId: "cph_a3",
        day: 14, status: CheckInStatus.responded, sentiment: "positive",
        notes: "Quiere competir en otoño", createdAt: daysAgo(16) },
      { id: "chk_05", organizationId: ORG_A, memberId: "mbr_nuria", coachId: "cph_a2",
        day: 1, status: CheckInStatus.sent, sentiment: null,
        notes: null, createdAt: daysAgo(1) },
      { id: "chk_06", organizationId: ORG_A, memberId: "mbr_javier", coachId: "cph_a3",
        day: 3, status: CheckInStatus.responded, sentiment: "neutral",
        notes: "Sin novedades", createdAt: daysAgo(2) },
      { id: "chk_07", organizationId: ORG_B, memberId: "mbr_marc", coachId: "cph_b1",
        day: 7, status: CheckInStatus.missed, sentiment: null,
        notes: "Segundo check-in sin respuesta", createdAt: daysAgo(4) },
      { id: "chk_08", organizationId: ORG_B, memberId: "mbr_clara", coachId: "cph_b2",
        day: 14, status: CheckInStatus.responded, sentiment: "positive",
        notes: null, createdAt: daysAgo(15) },
    ],
  });
  console.log("  ✓ 8 check-ins");

  // ── 9. MessageTemplates (12) ──────────────────────────────────────────────
  await prisma.messageTemplate.createMany({
    data: [
      // Org A (9)
      { id: "tpl_a_welcome", organizationId: ORG_A, category: "Bienvenida",
        title: "Bienvenida al box",
        body: "¡Bienvenida al box, {{nombre}}! Nos alegra tenerte aquí. Si tienes cualquier duda antes de la primera clase, escríbenos sin problema.",
        variables: ["nombre"], active: true, createdAt: daysAgo(200), updatedAt: NOW },
      { id: "tpl_a_after1", organizationId: ORG_A, category: "Después de primera clase",
        title: "Tras la primera clase",
        body: "Hola, {{nombre}}. ¿Qué tal te encontraste después de la primera clase? Es normal tener agujetas. Te recomiendo venir el jueves a las 19:00 para seguir cogiendo ritmo.",
        variables: ["nombre"], active: true, createdAt: daysAgo(200), updatedAt: NOW },
      { id: "tpl_a_noreturn", organizationId: ORG_A, category: "No volvió en 7 días",
        title: "Sin volver esta semana",
        body: "Hola, {{nombre}}. Vi que no has podido volver esta semana. ¿Todo bien? Si te da cosa retomar, te ayudamos a elegir una clase suave para volver sin presión.",
        variables: ["nombre"], active: true, createdAt: daysAgo(200), updatedAt: NOW },
      { id: "tpl_a_checkin14", organizationId: ORG_A, category: "Check-in día 14",
        title: "Check-in de hábito",
        body: "Hola, {{nombre}}. Ya llevas dos semanas con nosotros. ¿Cómo lo estás viviendo? Buscamos un par de horarios fijos para que cojas rutina.",
        variables: ["nombre"], active: true, createdAt: daysAgo(200), updatedAt: NOW },
      { id: "tpl_a_reinforce", organizationId: ORG_A, category: "Refuerzo positivo",
        title: "Vas muy bien",
        body: "{{nombre}}, lo estás haciendo genial. Se nota la constancia. Sigue así, vas por muy buen camino.",
        variables: ["nombre"], active: true, createdAt: daysAgo(200), updatedAt: NOW },
      { id: "tpl_a_day30", organizationId: ORG_A, category: "Día 30",
        title: "Primer mes completado",
        body: "{{nombre}}, ya llevas tu primer mes con nosotros. Muy buen comienzo. El siguiente objetivo sería mantener 2–3 sesiones por semana este mes.",
        variables: ["nombre"], active: true, createdAt: daysAgo(200), updatedAt: NOW },
      { id: "tpl_a_reactivate", organizationId: ORG_A, category: "Reactivación suave",
        title: "Te echamos de menos",
        body: "Hola, {{nombre}}. Te hemos echado de menos por el box. Sin presión: ¿te reservo una clase tranquila esta semana para retomar?",
        variables: ["nombre"], active: true, createdAt: daysAgo(200), updatedAt: NOW },
      { id: "tpl_a_injury", organizationId: ORG_A, category: "Lesión / molestia",
        title: "Vuelta segura",
        body: "Hola, {{nombre}}. El coach puede prepararte una versión adaptada de los ejercicios. Dime qué día te viene y lo dejamos listo.",
        variables: ["nombre"], active: true, createdAt: daysAgo(200), updatedAt: NOW },
      { id: "tpl_a_classreco", organizationId: ORG_A, category: "Recomendación de clase",
        title: "Clase recomendada",
        body: "Hola, {{nombre}}. Por tu objetivo y nivel, te encajaría muy bien la clase del miércoles a las 18:00. ¿Te la reservo?",
        variables: ["nombre"], active: true, createdAt: daysAgo(200), updatedAt: NOW },
      // Org B (3)
      { id: "tpl_b_welcome", organizationId: ORG_B, category: "Bienvenida",
        title: "Bienvenida a Box Norte",
        body: "¡Bienvenido a Box Norte, {{nombre}}! Cualquier duda antes de empezar, aquí estamos.",
        variables: ["nombre"], active: true, createdAt: daysAgo(200), updatedAt: NOW },
      { id: "tpl_b_after1", organizationId: ORG_B, category: "Después de primera clase",
        title: "Tras la primera clase",
        body: "Hola, {{nombre}}. ¿Cómo fue la primera clase? Te recomiendo repetir esta semana para coger ritmo.",
        variables: ["nombre"], active: true, createdAt: daysAgo(200), updatedAt: NOW },
      { id: "tpl_b_reactivate", organizationId: ORG_B, category: "Reactivación suave",
        title: "Volvemos cuando quieras",
        body: "Hola, {{nombre}}. Cuando te venga bien, te reservamos una clase tranquila para retomar.",
        variables: ["nombre"], active: true, createdAt: daysAgo(200), updatedAt: NOW },
    ],
  });
  console.log("  ✓ 12 plantillas de mensajes");

  // ── 10. Tasks (30) ────────────────────────────────────────────────────────
  type TSpec = [string, string | null, string, string, Priority, TaskStatus, number | null, number | null];
  const taskSpecs: TSpec[] = [
    [ORG_A, "mbr_nuria",   "usr_a_c2",  "Enviar mensaje post primera clase",      Priority.high,   TaskStatus.today,     0,    null],
    [ORG_A, "mbr_marta",   "usr_a_c2",  "Contactar a Marta — no volvió",          Priority.high,   TaskStatus.today,     0,    null],
    [ORG_A, "mbr_david",   "usr_a_mgr", "Asignar coach a David",                  Priority.high,   TaskStatus.today,     0,    null],
    [ORG_A, "mbr_sara",    "usr_a_c2",  "Recomendar 2ª visita a Sara",            Priority.medium, TaskStatus.today,     0,    null],
    [ORG_A, "mbr_ana",     "usr_a_c1",  "Revisar escalados de Ana (lesión)",      Priority.medium, TaskStatus.this_week, 1,    null],
    [ORG_A, "mbr_laura",   "usr_a_c1",  "Check-in de hábito día 14 — Laura",      Priority.medium, TaskStatus.this_week, 2,    null],
    [ORG_A, "mbr_javier",  "usr_a_c3",  "Recomendar próxima clase a Javier",      Priority.low,    TaskStatus.this_week, 3,    null],
    [ORG_A, "mbr_elenat",  "usr_a_c4",  "Check-in día 14 — Elena",               Priority.medium, TaskStatus.this_week, 4,    null],
    [ORG_A, "mbr_lucia",   "usr_a_c4",  "Check-in semanal — Lucía",              Priority.low,    TaskStatus.this_week, 5,    null],
    [ORG_A, "mbr_carlos",  "usr_a_c3",  "Preparar resumen día 30 de Carlos",      Priority.medium, TaskStatus.pending,   6,    null],
    [ORG_A, "mbr_diego",   "usr_a_c1",  "Recomendar clase de técnica a Diego",    Priority.low,    TaskStatus.pending,   7,    null],
    [ORG_A, "mbr_pablog",  "usr_a_c4",  "Intentar reactivación de Pablo",         Priority.low,    TaskStatus.pending,   8,    null],
    [ORG_A, "mbr_hugo",    "usr_a_c3",  "Confirmar objetivo de 3 días/sem — Hugo",Priority.low,    TaskStatus.pending,   9,    null],
    [ORG_A, null,          "usr_a_mgr", "Revisar nuevas altas de la semana",       Priority.medium, TaskStatus.pending,   5,    null],
    [ORG_A, "mbr_david",   "usr_a_c2",  "Enviar bienvenida a David",              Priority.medium, TaskStatus.completed, null, 3],
    [ORG_A, "mbr_roberto", "usr_a_c1",  "Resumen día 30 enviado a Roberto",       Priority.medium, TaskStatus.completed, null, 4],
    [ORG_A, "mbr_nuria",   "usr_a_c2",  "Bienvenida enviada a Nuria",             Priority.low,    TaskStatus.completed, null, 2],
    [ORG_A, "mbr_carlos",  "usr_a_c3",  "Check-in día 14 con Carlos",             Priority.low,    TaskStatus.completed, null, 16],
    [ORG_A, "mbr_laura",   "usr_a_c1",  "Bienvenida enviada a Laura",             Priority.low,    TaskStatus.completed, null, 14],
    [ORG_A, "mbr_javier",  "usr_a_c3",  "Registrar sensación post-clase — Javier",Priority.low,   TaskStatus.completed, null, 2],
    [ORG_A, "mbr_sara",    "usr_a_c2",  "Bienvenida enviada a Sara",              Priority.low,    TaskStatus.completed, null, 6],
    [ORG_A, "mbr_pablog",  "usr_a_c4",  "Llamada de seguimiento (sin respuesta)", Priority.low,    TaskStatus.cancelled, null, null],
    [ORG_B, "mbr_rosa",    "usr_b_c2",  "Enviar bienvenida a Rosa",               Priority.high,   TaskStatus.today,     0,    null],
    [ORG_B, "mbr_irene",   "usr_b_c2",  "Mensaje post primera clase — Irene",     Priority.medium, TaskStatus.today,     0,    null],
    [ORG_B, "mbr_marc",    "usr_b_c1",  "Llamar a Marc — canceló dos clases",     Priority.high,   TaskStatus.this_week, 1,    null],
    [ORG_B, "mbr_clara",   "usr_b_c2",  "Preparar resumen día 30 — Clara",        Priority.medium, TaskStatus.this_week, 2,    null],
    [ORG_B, "mbr_aitor",   "usr_b_c1",  "Recomendar próxima clase a Aitor",       Priority.low,    TaskStatus.pending,   4,    null],
    [ORG_B, "mbr_pau",     "usr_b_c1",  "Reactivación suave — Pau",               Priority.low,    TaskStatus.pending,   6,    null],
    [ORG_B, "mbr_clara",   "usr_b_c2",  "Bienvenida enviada a Clara",             Priority.low,    TaskStatus.completed, null, 28],
    [ORG_B, "mbr_marc",    "usr_b_c1",  "Llamada de seguimiento (sin respuesta)", Priority.low,    TaskStatus.cancelled, null, null],
  ];

  let taskSeq = 0;
  for (const [org, memberId, assignee, title, priority, status, dueGap, compGap] of taskSpecs) {
    taskSeq++;
    await prisma.task.create({
      data: {
        id: `tsk_${String(taskSeq).padStart(2, "0")}`,
        organizationId: org, memberId: memberId ?? null,
        assignedToUserId: assignee, title,
        description: null, priority, status,
        dueDate: status === TaskStatus.cancelled ? null : dueGap === null ? null : daysAhead(dueGap),
        completedAt: status === TaskStatus.completed ? daysAgo(compGap ?? 1) : null,
        createdAt: daysAgo((compGap ?? 0) + 5), updatedAt: NOW,
      },
    });
  }
  console.log("  ✓ 30 tareas");

  // ── 11. RiskAlerts (12) ───────────────────────────────────────────────────
  type ASpec = [string, string, RiskLevel, string, string, string | null, Priority, AlertStatus, number | null];
  const alertSpecs: ASpec[] = [
    [ORG_A, "mbr_marta",   RiskLevel.high,   "No volvió tras la primera clase",              "Llamar y ofrecer una clase suave",                 "tpl_a_noreturn",   Priority.high,   AlertStatus.open,     null],
    [ORG_A, "mbr_ana",     RiskLevel.medium, "Solo 1 asistencia en los últimos 14 días",     "Revisar escalados y proponer horario fijo",         "tpl_a_reactivate", Priority.high,   AlertStatus.open,     null],
    [ORG_A, "mbr_david",   RiskLevel.medium, "Sin coach asignado",                           "Asignar coach disponible",                          null,               Priority.medium, AlertStatus.open,     null],
    [ORG_A, "mbr_laura",   RiskLevel.medium, "10 días sin segunda visita registrada",        "Check-in de hábito día 14",                         "tpl_a_checkin14",  Priority.medium, AlertStatus.open,     null],
    [ORG_A, "mbr_sara",    RiskLevel.low,    "Sin segunda visita reservada",                 "Recomendar próxima clase",                          "tpl_a_classreco",  Priority.low,    AlertStatus.open,     null],
    [ORG_A, "mbr_pablog",  RiskLevel.high,   "14 días sin asistir",                          "Intentar reactivación o marcar baja",               "tpl_a_reactivate", Priority.medium, AlertStatus.snoozed,  null],
    [ORG_A, "mbr_nuria",   RiskLevel.low,    "Sin check-in respondido",                      "Enviar check-in inicial",                           null,               Priority.low,    AlertStatus.open,     null],
    [ORG_A, "mbr_javier",  RiskLevel.low,    "Cadencia irregular",                           "Recomendar horario fijo",                           "tpl_a_classreco",  Priority.low,    AlertStatus.resolved, 2],
    [ORG_A, "mbr_carlos",  RiskLevel.low,    "Día 30 pendiente de cierre",                   "Enviar resumen de día 30",                          "tpl_a_day30",      Priority.low,    AlertStatus.resolved, 1],
    [ORG_B, "mbr_marc",    RiskLevel.medium, "Canceló dos clases seguidas",                  "Llamar y ofrecer horario fijo",                     "tpl_b_reactivate", Priority.high,   AlertStatus.open,     null],
    [ORG_B, "mbr_pau",     RiskLevel.high,   "16 días sin asistir y sin responder",          "Reactivación suave o baja",                         "tpl_b_reactivate", Priority.medium, AlertStatus.snoozed,  null],
    [ORG_B, "mbr_aitor",   RiskLevel.low,    "Sin segunda visita reservada",                 "Recomendar próxima clase",                          null,               Priority.low,    AlertStatus.resolved, 3],
  ];

  const memberLastAtt: Record<string, Date | null> = {};
  for (const spec of memberSpecs) {
    if (spec.atts > 0) {
      memberLastAtt[spec.id] = daysAgo(spec.gap);
    } else {
      memberLastAtt[spec.id] = null;
    }
  }

  let alertSeq = 0;
  for (const [org, memberId, risk, reason, action, tplId, priority, status, resGap] of alertSpecs) {
    alertSeq++;
    const lastAt = memberLastAtt[memberId];
    const dsla = lastAt ? Math.round((NOW.getTime() - lastAt.getTime()) / 86_400_000) : null;
    await prisma.riskAlert.create({
      data: {
        id: `alr_${String(alertSeq).padStart(2, "0")}`,
        organizationId: org, memberId, riskLevel: risk, reason,
        daysSinceLastAttendance: dsla, suggestedAction: action,
        suggestedMessage: tplId ?? null, priority, status,
        resolvedAt: status === AlertStatus.resolved ? daysAgo(resGap ?? 1) : null,
        createdAt: daysAgo((resGap ?? 0) + 3), updatedAt: NOW,
      },
    });
  }
  console.log("  ✓ 12 alertas de riesgo");

  // ── 12. MessageLogs (5) ───────────────────────────────────────────────────
  await prisma.messageLog.createMany({
    data: [
      { id: "log_01", organizationId: ORG_A, memberId: "mbr_marta",
        templateId: "tpl_a_noreturn", sentByUserId: "usr_a_c2",
        channel: MessageChannel.whatsapp,
        body: "Hola, Marta. Vi que no has podido volver esta semana…",
        status: MessageStatus.copied, copiedAt: daysAgo(1), sentAt: null, createdAt: daysAgo(1) },
      { id: "log_02", organizationId: ORG_A, memberId: "mbr_roberto",
        templateId: "tpl_a_day30", sentByUserId: "usr_a_c1",
        channel: MessageChannel.whatsapp,
        body: "Roberto, ya llevas tu primer mes…",
        status: MessageStatus.sent, copiedAt: null, sentAt: daysAgo(4), createdAt: daysAgo(4) },
      { id: "log_03", organizationId: ORG_A, memberId: "mbr_nuria",
        templateId: "tpl_a_welcome", sentByUserId: "usr_a_c2",
        channel: MessageChannel.whatsapp,
        body: "¡Bienvenida al box, Nuria!…",
        status: MessageStatus.sent, copiedAt: null, sentAt: daysAgo(2), createdAt: daysAgo(2) },
      { id: "log_04", organizationId: ORG_A, memberId: "mbr_laura",
        templateId: "tpl_a_reinforce", sentByUserId: "usr_a_c1",
        channel: MessageChannel.email,
        body: "Laura, lo estás haciendo genial…",
        status: MessageStatus.sent, copiedAt: null, sentAt: daysAgo(6), createdAt: daysAgo(6) },
      { id: "log_05", organizationId: ORG_A, memberId: "mbr_ana",
        templateId: "tpl_a_injury", sentByUserId: "usr_a_c1",
        channel: MessageChannel.whatsapp,
        body: "Hola, Ana. El coach puede prepararte…",
        status: MessageStatus.copied, copiedAt: daysAgo(3), sentAt: null, createdAt: daysAgo(3) },
    ],
  });
  console.log("  ✓ 5 message logs");

  // ── 13. OnboardingRules (8) ───────────────────────────────────────────────
  const ruleTypes = [
    { type: "no_return_7d", threshold: 7, action: "create_alert" },
    { type: "low_attendance_14d", threshold: 2, action: "create_alert" },
    { type: "no_coach", threshold: 0, action: "create_task" },
    { type: "checkin_no_response", threshold: 0, action: "create_alert" },
  ];
  for (const org of [ORG_A, ORG_B]) {
    for (const r of ruleTypes) {
      await prisma.onboardingRule.create({
        data: {
          id: `rule_${org}_${r.type}`,
          organizationId: org, type: r.type, enabled: true,
          thresholdValue: r.threshold, action: r.action,
          createdAt: daysAgo(200), updatedAt: NOW,
        },
      });
    }
  }
  console.log("  ✓ 8 onboarding rules");

  // ── 14. WeeklyReports (2) ─────────────────────────────────────────────────
  const weekStart = new Date(NOW);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // lunes
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  await prisma.weeklyReport.createMany({
    data: [
      { id: "rep_a_w1", organizationId: ORG_A, weekStart, weekEnd, createdAt: NOW,
        metricsJson: { newMembers: 9, secondVisits: 4, activated: 5, noSecondVisit: 2,
          noReturn: 2, noCoach: 1, day30Completed: 3, tasksCompleted: 16,
          secondVisitRate: 0.56, activationRate: 0.62, avgAttendanceFirst14: 3.4, atRisk: 3 },
        summary: "Esta semana entraron 9 socios nuevos. 4 ya hicieron segunda visita. 2 no han vuelto tras la primera clase. 1 no tiene coach asignado. 3 completan día 30 esta semana. Acción prioritaria: contactar a Marta y revisar el onboarding de David antes del miércoles." },
      { id: "rep_b_w1", organizationId: ORG_B, weekStart, weekEnd, createdAt: NOW,
        metricsJson: { newMembers: 4, secondVisits: 2, activated: 1, noSecondVisit: 1,
          noReturn: 1, noCoach: 0, day30Completed: 1, tasksCompleted: 5,
          secondVisitRate: 0.5, activationRate: 0.5, avgAttendanceFirst14: 2.1, atRisk: 1 },
        summary: "Semana con 4 altas en Box Norte. 2 hicieron segunda visita y 1 completa día 30. Marc canceló dos clases seguidas: prioridad llamarle y fijar horario." },
    ],
  });
  console.log("  ✓ 2 informes semanales");

  // ── 15. AuditLogs (20) ────────────────────────────────────────────────────
  type LSpec = [string, string, string, string, string, number];
  const auditSpecs: LSpec[] = [
    [ORG_A, "usr_a_owner", "Member",      "mbr_marta",  "created",          7],
    [ORG_A, "usr_a_c2",   "RiskAlert",   "alr_01",     "created",          6],
    [ORG_A, "usr_a_mgr",  "Member",      "mbr_david",  "created",          3],
    [ORG_A, "usr_a_c2",   "MessageLog",  "log_03",     "sent_message",     2],
    [ORG_A, "usr_a_c1",   "Task",        "tsk_16",     "completed_task",   4],
    [ORG_A, "usr_a_c1",   "RiskAlert",   "alr_09",     "resolved_alert",   1],
    [ORG_A, "usr_a_c3",   "RiskAlert",   "alr_08",     "resolved_alert",   2],
    [ORG_A, "usr_a_c1",   "Member",      "mbr_roberto","updated",           4],
    [ORG_A, "usr_a_owner","WeeklyReport","rep_a_w1",   "generated_report", 0],
    [ORG_A, "usr_a_c2",   "MessageLog",  "log_01",     "sent_message",     1],
    [ORG_A, "usr_a_c3",   "CheckIn",     "chk_04",     "created",          16],
    [ORG_A, "usr_a_mgr",  "Member",      "mbr_nuria",  "created",          2],
    [ORG_A, "usr_a_c1",   "Member",      "mbr_ana",    "updated",           7],
    [ORG_A, "usr_a_c2",   "Task",        "tsk_15",     "completed_task",   3],
    [ORG_B, "usr_b_owner","Member",      "mbr_clara",  "created",          29],
    [ORG_B, "usr_b_c1",   "RiskAlert",   "alr_10",     "created",          4],
    [ORG_B, "usr_b_c2",   "MessageLog",  "log_02",     "sent_message",     4],
    [ORG_B, "usr_b_c1",   "Task",        "tsk_30",     "updated",           2],
    [ORG_B, "usr_b_owner","WeeklyReport","rep_b_w1",   "generated_report", 0],
    [ORG_B, "usr_b_c1",   "Member",      "mbr_marc",   "updated",           8],
  ];

  let logSeq = 0;
  for (const [org, actor, type, entityId, action, gap] of auditSpecs) {
    logSeq++;
    await prisma.auditLog.create({
      data: {
        id: `aud_${String(logSeq).padStart(2, "0")}`,
        organizationId: org, actorUserId: actor,
        entityType: type, entityId, action,
        createdAt: daysAgo(gap),
      },
    });
  }
  console.log("  ✓ 20 audit logs");

  console.log("\n✅ Seed completado.");
  console.log(`   Org A (${ORG_A}): 14 socios, 4 coaches, 30 tareas (22), 9 alertas, 9 plantillas`);
  console.log(`   Org B (${ORG_B}): 6 socios, 2 coaches, 8 tareas, 3 alertas, 3 plantillas`);
}

main()
  .catch((e) => { console.error("❌ Seed falló:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
