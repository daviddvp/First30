/* ============================================================================
   First30 — Seed mock coherente (2 organizaciones, sin mezclar datos).
   Construido con builders deterministas: las asistencias derivan
   lastAttendanceAt y activan las reglas de coherencia automáticamente.
   ========================================================================== */
import { NOW, isoDaysAgo, isoDaysAhead, daysBetween, startOfWeek, endOfWeek, toISO } from "../lib/date";
import type {
  Database, Organization, User, CoachProfile, Member, Attendance, CheckIn,
  Task, RiskAlert, MessageTemplate, MessageLog, OnboardingRule, WeeklyReport,
  AuditLog, MemberStatus, RiskLevel, MemberLevel, Priority, TaskStatus, AlertStatus,
} from "../types";

const TS = toISO(NOW);
const ORG_A = "org_centro";
const ORG_B = "org_norte";

/* ---------- Organizations (2) ---------- */
const organizations: Organization[] = [
  { id: ORG_A, name: "CrossBox Centro", slug: "crossbox-centro", timezone: "Europe/Madrid", brandingColor: "#1f7a4d", createdAt: isoDaysAgo(420), updatedAt: TS },
  { id: ORG_B, name: "Box Norte Strength", slug: "box-norte", timezone: "Europe/Madrid", brandingColor: "#d97706", createdAt: isoDaysAgo(300), updatedAt: TS },
];

/* ---------- Users (10: 2 owners, 2 managers, 6 coaches) ---------- */
const users: User[] = [
  { id: "usr_a_owner", organizationId: ORG_A, name: "Carla Núñez", email: "carla@crossboxcentro.es", role: "owner", avatarUrl: null, createdAt: isoDaysAgo(420), updatedAt: TS },
  { id: "usr_a_mgr", organizationId: ORG_A, name: "Marcos Ferrer", email: "marcos@crossboxcentro.es", role: "manager", avatarUrl: null, createdAt: isoDaysAgo(380), updatedAt: TS },
  { id: "usr_a_c1", organizationId: ORG_A, name: "Sergio Romero", email: "sergio@crossboxcentro.es", role: "coach", avatarUrl: null, createdAt: isoDaysAgo(360), updatedAt: TS },
  { id: "usr_a_c2", organizationId: ORG_A, name: "Elena Marín", email: "elena@crossboxcentro.es", role: "coach", avatarUrl: null, createdAt: isoDaysAgo(350), updatedAt: TS },
  { id: "usr_a_c3", organizationId: ORG_A, name: "Pablo Costa", email: "pablo@crossboxcentro.es", role: "coach", avatarUrl: null, createdAt: isoDaysAgo(340), updatedAt: TS },
  { id: "usr_a_c4", organizationId: ORG_A, name: "Lucas Prieto", email: "lucas@crossboxcentro.es", role: "coach", avatarUrl: null, createdAt: isoDaysAgo(120), updatedAt: TS },
  { id: "usr_b_owner", organizationId: ORG_B, name: "Laia Vives", email: "laia@boxnorte.es", role: "owner", avatarUrl: null, createdAt: isoDaysAgo(300), updatedAt: TS },
  { id: "usr_b_mgr", organizationId: ORG_B, name: "Bruno Castro", email: "bruno@boxnorte.es", role: "manager", avatarUrl: null, createdAt: isoDaysAgo(280), updatedAt: TS },
  { id: "usr_b_c1", organizationId: ORG_B, name: "Noa Sanz", email: "noa@boxnorte.es", role: "coach", avatarUrl: null, createdAt: isoDaysAgo(270), updatedAt: TS },
  { id: "usr_b_c2", organizationId: ORG_B, name: "Iván Mora", email: "ivan@boxnorte.es", role: "coach", avatarUrl: null, createdAt: isoDaysAgo(200), updatedAt: TS },
];

/* ---------- CoachProfiles (6) ---------- */
const coachProfiles: CoachProfile[] = [
  { id: "cph_a1", userId: "usr_a_c1", organizationId: ORG_A, specialties: ["Halterofilia", "Fuerza"], maxActiveNewMembers: 8, active: true, createdAt: isoDaysAgo(360), updatedAt: TS },
  { id: "cph_a2", userId: "usr_a_c2", organizationId: ORG_A, specialties: ["Onboarding", "Movilidad"], maxActiveNewMembers: 6, active: true, createdAt: isoDaysAgo(350), updatedAt: TS },
  { id: "cph_a3", userId: "usr_a_c3", organizationId: ORG_A, specialties: ["Competición", "Gimnásticos"], maxActiveNewMembers: 7, active: true, createdAt: isoDaysAgo(340), updatedAt: TS },
  { id: "cph_a4", userId: "usr_a_c4", organizationId: ORG_A, specialties: ["HIIT", "Acondicionamiento"], maxActiveNewMembers: 5, active: true, createdAt: isoDaysAgo(120), updatedAt: TS },
  { id: "cph_b1", userId: "usr_b_c1", organizationId: ORG_B, specialties: ["Fuerza", "Powerlifting"], maxActiveNewMembers: 8, active: true, createdAt: isoDaysAgo(270), updatedAt: TS },
  { id: "cph_b2", userId: "usr_b_c2", organizationId: ORG_B, specialties: ["Functional", "HIIT"], maxActiveNewMembers: 6, active: true, createdAt: isoDaysAgo(200), updatedAt: TS },
];

/* ---------- Members (20) ----------
   Spec: org, id, fullName, goal, day, status, risk, reason, level, coachId,
         limitations, fears, source, score, gap(días desde últ. asistencia),
         attendanceCount, nextAction */
type MSpec = [
  org: string, id: string, name: string, goal: string, day: number,
  status: MemberStatus, risk: RiskLevel, reason: string | null, level: MemberLevel,
  coach: string | null, limitations: string | null, fears: string | null,
  source: string, score: number, gap: number, atts: number, next: string,
];
const M: MSpec[] = [
  // — Org A (14), con los 5 socios obligatorios —
  [ORG_A, "mbr_marta", "Marta García", "Perder peso", 8, "at_risk", "high", "No volvió tras la primera clase", "beginner", "cph_a2", null, "Le preocupa no seguir el ritmo del resto", "Instagram", 18, 8, 1, "Contactar — no ha vuelto"],
  [ORG_A, "mbr_david", "David López", "Ganar fuerza", 3, "no_coach", "medium", "Sin coach asignado", "intermediate", null, "Molestia leve en hombro derecho", null, "Recomendación", 35, 1, 2, "Asignar coach"],
  [ORG_A, "mbr_laura", "Laura Sánchez", "Salud general", 14, "in_progress", "low", null, "beginner", "cph_a1", null, "Constancia: viene de varios intentos", "Web", 58, 3, 4, "Revisión de hábito día 14"],
  [ORG_A, "mbr_carlos", "Carlos Martín", "Competir", 30, "activated", "low", null, "advanced", "cph_a3", null, null, "Web", 88, 1, 8, "Enviar resumen día 30"],
  [ORG_A, "mbr_ana", "Ana Ruiz", "Volver al deporte", 21, "at_risk", "medium", "Solo 1 asistencia en los últimos 14 días", "beginner", "cph_a1", "Vuelve de lesión de rodilla", "Miedo a recaer en la lesión", "Recomendación", 30, 9, 3, "Revisar escalados"],
  [ORG_A, "mbr_roberto", "Roberto Díaz", "Salud general", 30, "completed", "low", null, "intermediate", "cph_a1", null, null, "Recomendación", 90, 2, 7, "Onboarding completado"],
  [ORG_A, "mbr_javier", "Javier Soler", "Ganar masa muscular", 5, "in_progress", "low", null, "intermediate", "cph_a3", null, null, "Instagram", 55, 2, 2, "Recomendar próxima clase"],
  [ORG_A, "mbr_nuria", "Nuria Pons", "Perder peso", 2, "in_progress", "low", null, "beginner", "cph_a2", null, "Primera vez en un box, le impone", "Web", 48, 0, 1, "Mensaje post primera clase"],
  [ORG_A, "mbr_lucia", "Lucía Romero", "Tonificar", 10, "in_progress", "low", null, "beginner", "cph_a4", null, null, "Instagram", 60, 3, 2, "Check-in semanal"],
  [ORG_A, "mbr_pablog", "Pablo Gil", "Perder peso", 16, "churned", "low", "Dejó de venir tras la 2ª semana", "beginner", "cph_a4", null, null, "Web", 12, 14, 0, "Intentar reactivación"],
  [ORG_A, "mbr_sara", "Sara Vidal", "Salud general", 6, "in_progress", "low", null, "beginner", "cph_a2", null, null, "Recomendación", 50, 4, 1, "Recomendar 2ª visita"],
  [ORG_A, "mbr_hugo", "Hugo Marín", "Ganar fuerza", 25, "activated", "low", null, "intermediate", "cph_a3", null, null, "Web", 80, 1, 3, "Mantener ritmo 3 días/sem"],
  [ORG_A, "mbr_elenat", "Elena Torres", "Volver al deporte", 12, "in_progress", "low", null, "beginner", "cph_a4", null, null, "Instagram", 57, 2, 2, "Check-in día 14"],
  [ORG_A, "mbr_diego", "Diego Navarro", "Competir", 4, "in_progress", "low", null, "advanced", "cph_a1", null, null, "Recomendación", 52, 1, 1, "Recomendar clase de técnica"],
  // — Org B (6) —
  [ORG_B, "mbr_aitor", "Aitor Ruano", "Ganar fuerza", 8, "in_progress", "low", null, "intermediate", "cph_b1", null, null, "Web", 56, 3, 1, "Recomendar próxima clase"],
  [ORG_B, "mbr_clara", "Clara Vega", "Competir", 29, "activated", "low", null, "advanced", "cph_b2", null, null, "Instagram", 82, 2, 1, "Preparar resumen día 30"],
  [ORG_B, "mbr_marc", "Marc Soler", "Perder peso", 11, "at_risk", "medium", "Canceló dos clases seguidas", "beginner", "cph_b1", null, "Horario complicado", "Recomendación", 28, 8, 0, "Llamar y ofrecer horario fijo"],
  [ORG_B, "mbr_irene", "Irene Lago", "Salud general", 5, "in_progress", "low", null, "beginner", "cph_b2", null, null, "Web", 49, 2, 1, "Mensaje post primera clase"],
  [ORG_B, "mbr_pau", "Pau Esteve", "Volver al deporte", 19, "churned", "low", "No respondió a los check-ins", "intermediate", "cph_b1", null, null, "Instagram", 15, 16, 0, "Reactivación suave"],
  [ORG_B, "mbr_rosa", "Rosa Camps", "Tonificar", 3, "in_progress", "low", null, "beginner", "cph_b2", null, null, "Recomendación", 47, 1, 0, "Enviar bienvenida"],
];

const CLASS_TYPES = ["WOD", "Halterofilia", "Iniciación", "HIIT", "Open Box", "Fuerza"];

/* Construye `atts` asistencias por socio, repartidas entre el día ~1 y `gap`
   días atrás. La última asistencia fija lastAttendanceAt del socio. */
let attSeq = 0;
const attendances: Attendance[] = [];
const members: Member[] = M.map((s) => {
  const [org, id, name, goal, day, status, risk, reason, level, coach, lim, fears, source, score, gap, atts, next] = s;
  // coach para impartir clases: el asignado o, si no tiene, un coach del mismo box.
  const classCoach = coach ?? (org === ORG_A ? "cph_a1" : "cph_b1");
  let lastAt: string | null = null;
  if (atts > 0) {
    const first = Math.max(day - 1, gap);
    for (let i = 0; i < atts; i++) {
      const offset = atts === 1 ? gap : Math.round(first - ((first - gap) * i) / (atts - 1));
      const iso = isoDaysAgo(offset);
      attendances.push({
        id: `att_${String(++attSeq).padStart(3, "0")}`, organizationId: org, memberId: id,
        classDate: iso, classType: CLASS_TYPES[(attSeq + day) % CLASS_TYPES.length],
        coachId: classCoach, notes: null, createdAt: iso,
      });
      lastAt = iso;
    }
  }
  return {
    id, organizationId: org, fullName: name,
    email: `${id.replace("mbr_", "")}@example.com`, phone: "+34 6XX XXX XXX",
    joinDate: isoDaysAgo(day), onboardingDay: day, status, riskLevel: risk, riskReason: reason,
    mainGoal: goal, level, limitations: lim, fears, acquisitionSource: source,
    assignedCoachId: coach, lastAttendanceAt: lastAt, nextRecommendedAction: next,
    activationScore: score, createdAt: isoDaysAgo(day), updatedAt: TS,
  };
});
const memberById = (id: string) => members.find((m) => m.id === id)!;

/* ---------- CheckIns (8) ---------- */
const checkIns: CheckIn[] = [
  { id: "chk_01", organizationId: ORG_A, memberId: "mbr_marta", coachId: "cph_a2", day: 3, status: "missed", sentiment: null, notes: "No respondió al primer check-in", createdAt: isoDaysAgo(4) },
  { id: "chk_02", organizationId: ORG_A, memberId: "mbr_laura", coachId: "cph_a1", day: 7, status: "responded", sentiment: "positive", notes: "Contenta con la progresión", createdAt: isoDaysAgo(7) },
  { id: "chk_03", organizationId: ORG_A, memberId: "mbr_ana", coachId: "cph_a1", day: 14, status: "missed", sentiment: null, notes: null, createdAt: isoDaysAgo(7) },
  { id: "chk_04", organizationId: ORG_A, memberId: "mbr_carlos", coachId: "cph_a3", day: 14, status: "responded", sentiment: "positive", notes: "Quiere competir en otoño", createdAt: isoDaysAgo(16) },
  { id: "chk_05", organizationId: ORG_A, memberId: "mbr_nuria", coachId: "cph_a2", day: 1, status: "sent", sentiment: null, notes: null, createdAt: isoDaysAgo(1) },
  { id: "chk_06", organizationId: ORG_A, memberId: "mbr_javier", coachId: "cph_a3", day: 3, status: "responded", sentiment: "neutral", notes: "Sin novedades", createdAt: isoDaysAgo(2) },
  { id: "chk_07", organizationId: ORG_B, memberId: "mbr_marc", coachId: "cph_b1", day: 7, status: "missed", sentiment: null, notes: "Segundo check-in sin respuesta", createdAt: isoDaysAgo(4) },
  { id: "chk_08", organizationId: ORG_B, memberId: "mbr_clara", coachId: "cph_b2", day: 14, status: "responded", sentiment: "positive", notes: null, createdAt: isoDaysAgo(15) },
];

/* ---------- MessageTemplates (12: 9 en A, 3 en B) ---------- */
const tpl = (id: string, org: string, category: string, title: string, body: string): MessageTemplate => ({
  id, organizationId: org, category, title, body, variables: ["nombre"], active: true,
  createdAt: isoDaysAgo(200), updatedAt: TS,
});
const messageTemplates: MessageTemplate[] = [
  tpl("tpl_a_welcome", ORG_A, "Bienvenida", "Bienvenida al box", "¡Bienvenida al box, {{nombre}}! Nos alegra tenerte aquí. Si tienes cualquier duda antes de la primera clase, escríbenos sin problema."),
  tpl("tpl_a_after1", ORG_A, "Después de primera clase", "Tras la primera clase", "Hola, {{nombre}}. ¿Qué tal te encontraste después de la primera clase? Es normal tener agujetas. Te recomiendo venir el jueves a las 19:00 para seguir cogiendo ritmo."),
  tpl("tpl_a_noreturn", ORG_A, "No volvió en 7 días", "Sin volver esta semana", "Hola, {{nombre}}. Vi que no has podido volver esta semana. ¿Todo bien? Si te da cosa retomar, te ayudamos a elegir una clase suave para volver sin presión."),
  tpl("tpl_a_checkin14", ORG_A, "Check-in día 14", "Check-in de hábito", "Hola, {{nombre}}. Ya llevas dos semanas con nosotros. ¿Cómo lo estás viviendo? Buscamos un par de horarios fijos para que cojas rutina."),
  tpl("tpl_a_reinforce", ORG_A, "Refuerzo positivo", "Vas muy bien", "{{nombre}}, lo estás haciendo genial. Se nota la constancia. Sigue así, vas por muy buen camino."),
  tpl("tpl_a_day30", ORG_A, "Día 30", "Primer mes completado", "{{nombre}}, ya llevas tu primer mes con nosotros. Muy buen comienzo. El siguiente objetivo sería mantener 2–3 sesiones por semana este mes."),
  tpl("tpl_a_reactivate", ORG_A, "Reactivación suave", "Te echamos de menos", "Hola, {{nombre}}. Te hemos echado de menos por el box. Sin presión: ¿te reservo una clase tranquila esta semana para retomar?"),
  tpl("tpl_a_injury", ORG_A, "Lesión / molestia", "Vuelta segura", "Hola, {{nombre}}. El coach puede prepararte una versión adaptada de los ejercicios. Dime qué día te viene y lo dejamos listo."),
  tpl("tpl_a_classreco", ORG_A, "Recomendación de clase", "Clase recomendada", "Hola, {{nombre}}. Por tu objetivo y nivel, te encajaría muy bien la clase del miércoles a las 18:00. ¿Te la reservo?"),
  tpl("tpl_b_welcome", ORG_B, "Bienvenida", "Bienvenida a Box Norte", "¡Bienvenido a Box Norte, {{nombre}}! Cualquier duda antes de empezar, aquí estamos."),
  tpl("tpl_b_after1", ORG_B, "Después de primera clase", "Tras la primera clase", "Hola, {{nombre}}. ¿Cómo fue la primera clase? Te recomiendo repetir esta semana para coger ritmo."),
  tpl("tpl_b_reactivate", ORG_B, "Reactivación suave", "Volvemos cuando quieras", "Hola, {{nombre}}. Cuando te venga bien, te reservamos una clase tranquila para retomar."),
];

/* ---------- Tasks (30: 22 en A, 8 en B) ----------
   spec: org, member|null, assignedTo(User), title, priority, status, dueGap(+fut/-pas), completedGap|null */
type TSpec = [string, string | null, string, string, Priority, TaskStatus, number | null, number | null];
const T: TSpec[] = [
  [ORG_A, "mbr_nuria", "usr_a_c2", "Enviar mensaje post primera clase", "high", "today", 0, null],
  [ORG_A, "mbr_marta", "usr_a_c2", "Contactar a Marta — no volvió", "high", "today", 0, null],
  [ORG_A, "mbr_david", "usr_a_mgr", "Asignar coach a David", "high", "today", 0, null],
  [ORG_A, "mbr_sara", "usr_a_c2", "Recomendar 2ª visita a Sara", "medium", "today", 0, null],
  [ORG_A, "mbr_ana", "usr_a_c1", "Revisar escalados de Ana (lesión)", "medium", "this_week", 1, null],
  [ORG_A, "mbr_laura", "usr_a_c1", "Check-in de hábito día 14 — Laura", "medium", "this_week", 2, null],
  [ORG_A, "mbr_javier", "usr_a_c3", "Recomendar próxima clase a Javier", "low", "this_week", 3, null],
  [ORG_A, "mbr_elenat", "usr_a_c4", "Check-in día 14 — Elena", "medium", "this_week", 4, null],
  [ORG_A, "mbr_lucia", "usr_a_c4", "Check-in semanal — Lucía", "low", "this_week", 5, null],
  [ORG_A, "mbr_carlos", "usr_a_c3", "Preparar resumen día 30 de Carlos", "medium", "pending", 6, null],
  [ORG_A, "mbr_diego", "usr_a_c1", "Recomendar clase de técnica a Diego", "low", "pending", 7, null],
  [ORG_A, "mbr_pablog", "usr_a_c4", "Intentar reactivación de Pablo", "low", "pending", 8, null],
  [ORG_A, "mbr_hugo", "usr_a_c3", "Confirmar objetivo de 3 días/sem — Hugo", "low", "pending", 9, null],
  [ORG_A, null, "usr_a_mgr", "Revisar nuevas altas de la semana", "medium", "pending", 5, null],
  [ORG_A, "mbr_david", "usr_a_c2", "Enviar bienvenida a David", "medium", "completed", null, 3],
  [ORG_A, "mbr_roberto", "usr_a_c1", "Resumen día 30 enviado a Roberto", "medium", "completed", null, 4],
  [ORG_A, "mbr_nuria", "usr_a_c2", "Bienvenida enviada a Nuria", "low", "completed", null, 2],
  [ORG_A, "mbr_carlos", "usr_a_c3", "Check-in día 14 con Carlos", "low", "completed", null, 16],
  [ORG_A, "mbr_laura", "usr_a_c1", "Bienvenida enviada a Laura", "low", "completed", null, 14],
  [ORG_A, "mbr_javier", "usr_a_c3", "Registrar sensación post-clase — Javier", "low", "completed", null, 2],
  [ORG_A, "mbr_sara", "usr_a_c2", "Bienvenida enviada a Sara", "low", "completed", null, 6],
  [ORG_A, "mbr_pablog", "usr_a_c4", "Llamada de seguimiento (sin respuesta)", "low", "cancelled", null, null],
  [ORG_B, "mbr_rosa", "usr_b_c2", "Enviar bienvenida a Rosa", "high", "today", 0, null],
  [ORG_B, "mbr_irene", "usr_b_c2", "Mensaje post primera clase — Irene", "medium", "today", 0, null],
  [ORG_B, "mbr_marc", "usr_b_c1", "Llamar a Marc — canceló dos clases", "high", "this_week", 1, null],
  [ORG_B, "mbr_clara", "usr_b_c2", "Preparar resumen día 30 — Clara", "medium", "this_week", 2, null],
  [ORG_B, "mbr_aitor", "usr_b_c1", "Recomendar próxima clase a Aitor", "low", "pending", 4, null],
  [ORG_B, "mbr_pau", "usr_b_c1", "Reactivación suave — Pau", "low", "pending", 6, null],
  [ORG_B, "mbr_clara", "usr_b_c2", "Bienvenida enviada a Clara", "low", "completed", null, 28],
  [ORG_B, "mbr_marc", "usr_b_c1", "Llamada de seguimiento (sin respuesta)", "low", "cancelled", null, null],
];
let taskSeq = 0;
const tasks: Task[] = T.map(([org, member, assignee, title, priority, status, dueGap, compGap]) => {
  const id = `tsk_${String(++taskSeq).padStart(2, "0")}`;
  return {
    id, organizationId: org, memberId: member, assignedToUserId: assignee, title,
    description: null, priority, status,
    dueDate: status === "cancelled" ? null : dueGap === null ? null : isoDaysAhead(dueGap),
    completedAt: status === "completed" ? isoDaysAgo(compGap ?? 1) : null,
    createdAt: isoDaysAgo((compGap ?? 0) + 5), updatedAt: TS,
  };
});

/* ---------- RiskAlerts (12: 9 en A, 3 en B) ----------
   spec: org, member, risk, reason, action, templateId|null, priority, status, resolvedGap|null */
type ASpec = [string, string, RiskLevel, string, string, string | null, Priority, AlertStatus, number | null];
const A: ASpec[] = [
  [ORG_A, "mbr_marta", "high", "No volvió tras la primera clase", "Llamar y ofrecer una clase suave", "tpl_a_noreturn", "high", "open", null],
  [ORG_A, "mbr_ana", "medium", "Solo 1 asistencia en los últimos 14 días", "Revisar escalados y proponer horario fijo", "tpl_a_reactivate", "high", "open", null],
  [ORG_A, "mbr_david", "medium", "Sin coach asignado", "Asignar coach disponible", null, "medium", "open", null],
  [ORG_A, "mbr_laura", "medium", "10 días sin segunda visita registrada", "Check-in de hábito día 14", "tpl_a_checkin14", "medium", "open", null],
  [ORG_A, "mbr_sara", "low", "Sin segunda visita reservada", "Recomendar próxima clase", "tpl_a_classreco", "low", "open", null],
  [ORG_A, "mbr_pablog", "high", "14 días sin asistir", "Intentar reactivación o marcar baja", "tpl_a_reactivate", "medium", "snoozed", null],
  [ORG_A, "mbr_nuria", "low", "Sin check-in respondido", "Enviar check-in inicial", null, "low", "open", null],
  [ORG_A, "mbr_javier", "low", "Cadencia irregular", "Recomendar horario fijo", "tpl_a_classreco", "low", "resolved", 2],
  [ORG_A, "mbr_carlos", "low", "Día 30 pendiente de cierre", "Enviar resumen de día 30", "tpl_a_day30", "low", "resolved", 1],
  [ORG_B, "mbr_marc", "medium", "Canceló dos clases seguidas", "Llamar y ofrecer horario fijo", "tpl_b_reactivate", "high", "open", null],
  [ORG_B, "mbr_pau", "high", "16 días sin asistir y sin responder", "Reactivación suave o baja", "tpl_b_reactivate", "medium", "snoozed", null],
  [ORG_B, "mbr_aitor", "low", "Sin segunda visita reservada", "Recomendar próxima clase", null, "low", "resolved", 3],
];
let alertSeq = 0;
const alerts: RiskAlert[] = A.map(([org, member, risk, reason, action, tplId, priority, status, resGap]) => {
  const id = `alr_${String(++alertSeq).padStart(2, "0")}`;
  const m = memberById(member);
  const dsla = m.lastAttendanceAt ? daysBetween(m.lastAttendanceAt) : null;
  return {
    id, organizationId: org, memberId: member, riskLevel: risk, reason,
    daysSinceLastAttendance: dsla, suggestedAction: action, suggestedMessage: tplId,
    priority, status, resolvedAt: status === "resolved" ? isoDaysAgo(resGap ?? 1) : null,
    createdAt: isoDaysAgo((resGap ?? 0) + 3), updatedAt: TS,
  };
});

/* ---------- MessageLogs (5, solo A para muestra) ---------- */
const messageLogs: MessageLog[] = [
  { id: "log_01", organizationId: ORG_A, memberId: "mbr_marta", templateId: "tpl_a_noreturn", sentByUserId: "usr_a_c2", channel: "whatsapp", body: "Hola, Marta. Vi que no has podido volver esta semana…", status: "copied", copiedAt: isoDaysAgo(1), sentAt: null, createdAt: isoDaysAgo(1) },
  { id: "log_02", organizationId: ORG_A, memberId: "mbr_roberto", templateId: "tpl_a_day30", sentByUserId: "usr_a_c1", channel: "whatsapp", body: "Roberto, ya llevas tu primer mes…", status: "sent", copiedAt: null, sentAt: isoDaysAgo(4), createdAt: isoDaysAgo(4) },
  { id: "log_03", organizationId: ORG_A, memberId: "mbr_nuria", templateId: "tpl_a_welcome", sentByUserId: "usr_a_c2", channel: "whatsapp", body: "¡Bienvenida al box, Nuria!…", status: "sent", copiedAt: null, sentAt: isoDaysAgo(2), createdAt: isoDaysAgo(2) },
  { id: "log_04", organizationId: ORG_A, memberId: "mbr_laura", templateId: "tpl_a_reinforce", sentByUserId: "usr_a_c1", channel: "email", body: "Laura, lo estás haciendo genial…", status: "sent", copiedAt: null, sentAt: isoDaysAgo(6), createdAt: isoDaysAgo(6) },
  { id: "log_05", organizationId: ORG_A, memberId: "mbr_ana", templateId: "tpl_a_injury", sentByUserId: "usr_a_c1", channel: "whatsapp", body: "Hola, Ana. El coach puede prepararte…", status: "copied", copiedAt: isoDaysAgo(3), sentAt: null, createdAt: isoDaysAgo(3) },
];

/* ---------- OnboardingRules (8: 4 por org) ---------- */
const rulesFor = (org: string): OnboardingRule[] => ([
  { id: `rule_${org}_noreturn`, organizationId: org, type: "no_return_7d", enabled: true, thresholdValue: 7, action: "create_alert", createdAt: isoDaysAgo(200), updatedAt: TS },
  { id: `rule_${org}_lowatt`, organizationId: org, type: "low_attendance_14d", enabled: true, thresholdValue: 2, action: "create_alert", createdAt: isoDaysAgo(200), updatedAt: TS },
  { id: `rule_${org}_nocoach`, organizationId: org, type: "no_coach", enabled: true, thresholdValue: 0, action: "create_task", createdAt: isoDaysAgo(200), updatedAt: TS },
  { id: `rule_${org}_checkin`, organizationId: org, type: "checkin_no_response", enabled: true, thresholdValue: 0, action: "create_alert", createdAt: isoDaysAgo(200), updatedAt: TS },
]);
const onboardingRules: OnboardingRule[] = [...rulesFor(ORG_A), ...rulesFor(ORG_B)];

/* ---------- WeeklyReports (2: 1 por org) ---------- */
const weekStart = toISO(startOfWeek());
const weekEnd = toISO(endOfWeek());
const weeklyReports: WeeklyReport[] = [
  { id: "rep_a_w1", organizationId: ORG_A, weekStart, weekEnd, createdAt: TS,
    metricsJson: { newMembers: 9, secondVisits: 4, activated: 5, noSecondVisit: 2, noReturn: 2, noCoach: 1, day30Completed: 3, tasksCompleted: 16, secondVisitRate: 0.56, activationRate: 0.62, avgAttendanceFirst14: 3.4, atRisk: 3 },
    summary: "Esta semana entraron 9 socios nuevos. 4 ya hicieron segunda visita. 2 no han vuelto tras la primera clase. 1 no tiene coach asignado. 3 completan día 30 esta semana. Acción prioritaria: contactar a Marta y revisar el onboarding de David antes del miércoles." },
  { id: "rep_b_w1", organizationId: ORG_B, weekStart, weekEnd, createdAt: TS,
    metricsJson: { newMembers: 4, secondVisits: 2, activated: 1, noSecondVisit: 1, noReturn: 1, noCoach: 0, day30Completed: 1, tasksCompleted: 5, secondVisitRate: 0.5, activationRate: 0.5, avgAttendanceFirst14: 2.1, atRisk: 1 },
    summary: "Semana con 4 altas en Box Norte. 2 hicieron segunda visita y 1 completa día 30. Marc canceló dos clases seguidas: prioridad llamarle y fijar horario." },
];

/* ---------- AuditLogs (20: 14 en A, 6 en B) ---------- */
type LSpec = [string, string, string, string, AuditLog["action"], number];
const L: LSpec[] = [
  [ORG_A, "usr_a_owner", "Member", "mbr_marta", "created", 7],
  [ORG_A, "usr_a_c2", "RiskAlert", "alr_01", "created", 6],
  [ORG_A, "usr_a_mgr", "Member", "mbr_david", "created", 3],
  [ORG_A, "usr_a_c2", "MessageLog", "log_03", "sent_message", 2],
  [ORG_A, "usr_a_c1", "Task", "tsk_16", "completed_task", 4],
  [ORG_A, "usr_a_c1", "RiskAlert", "alr_09", "resolved_alert", 1],
  [ORG_A, "usr_a_c3", "RiskAlert", "alr_08", "resolved_alert", 2],
  [ORG_A, "usr_a_c1", "Member", "mbr_roberto", "updated", 4],
  [ORG_A, "usr_a_owner", "WeeklyReport", "rep_a_w1", "generated_report", 0],
  [ORG_A, "usr_a_c2", "MessageLog", "log_01", "sent_message", 1],
  [ORG_A, "usr_a_c3", "CheckIn", "chk_04", "created", 16],
  [ORG_A, "usr_a_mgr", "Member", "mbr_nuria", "created", 2],
  [ORG_A, "usr_a_c1", "Member", "mbr_ana", "updated", 7],
  [ORG_A, "usr_a_c2", "Task", "tsk_15", "completed_task", 3],
  [ORG_B, "usr_b_owner", "Member", "mbr_clara", "created", 29],
  [ORG_B, "usr_b_c1", "RiskAlert", "alr_10", "created", 4],
  [ORG_B, "usr_b_c2", "MessageLog", "log_02", "sent_message", 4],
  [ORG_B, "usr_b_c1", "Task", "tsk_30", "updated", 2],
  [ORG_B, "usr_b_owner", "WeeklyReport", "rep_b_w1", "generated_report", 0],
  [ORG_B, "usr_b_c1", "Member", "mbr_marc", "updated", 8],
];
let logSeq = 0;
const auditLogs: AuditLog[] = L.map(([org, actor, type, entityId, action, gap]) => ({
  id: `aud_${String(++logSeq).padStart(2, "0")}`, organizationId: org, actorUserId: actor,
  entityType: type, entityId, action, metadata: null, createdAt: isoDaysAgo(gap),
}));

/* ---------- Database exportada ---------- */
export const db: Database = {
  organizations, users, coachProfiles, members, attendances, checkIns,
  tasks, alerts, messageTemplates, messageLogs, onboardingRules, weeklyReports, auditLogs,
};
