/* ============================================================================
   First30 — Capa de consulta sobre el seed mock.
   TODO acceso pasa por una organización (orgScope) para no mezclar tenants.
   Esta API imita un repositorio: cuando se migre a Prisma/Supabase, se
   reimplementa el cuerpo manteniendo las mismas firmas.
   ========================================================================== */
import { store as db } from "./store";
import type {
  ID, Database, Organization, User, CoachProfile, Member, Attendance, CheckIn,
  Task, RiskAlert, MessageTemplate, MessageLog, OnboardingRule, WeeklyReport,
  AuditLog, MemberStatus, RiskLevel, TaskStatus, AlertStatus,
} from "../types";

/** Acceso directo al dataset (solo para depuración / tests). */
export const rawDb: Database = db;

export function listOrganizations(): Organization[] {
  return db.organizations;
}
export function getOrganization(orgId: ID): Organization | undefined {
  return db.organizations.find((o) => o.id === orgId);
}
export function getOrganizationBySlug(slug: string): Organization | undefined {
  return db.organizations.find((o) => o.slug === slug);
}

/** Devuelve una vista de consulta acotada a una organización. */
export function orgScope(orgId: ID) {
  const where = <T extends { organizationId: ID }>(rows: T[]) =>
    rows.filter((r) => r.organizationId === orgId);

  const members = () => where(db.members);
  const users = () => where(db.users);
  const coachProfiles = () => where(db.coachProfiles);
  const attendances = () => where(db.attendances);
  const tasks = () => where(db.tasks);
  const alerts = () => where(db.alerts);
  const templates = () => where(db.messageTemplates);

  return {
    organizationId: orgId,

    // -- Lecturas base --
    organization: () => getOrganization(orgId),
    users,
    user: (id: ID) => users().find((u) => u.id === id),
    coachProfiles: () => coachProfiles().filter((c) => c.active),
    allCoachProfiles: coachProfiles,
    coachProfile: (id: ID) => coachProfiles().find((c) => c.id === id),
    members,
    member: (id: ID) => members().find((m) => m.id === id),
    attendances,
    checkIns: () => where(db.checkIns),
    tasks,
    alerts,
    templates: () => templates().filter((t) => t.active),
    messageLogs: () => where(db.messageLogs),
    onboardingRules: () => where(db.onboardingRules),
    weeklyReports: () => where(db.weeklyReports),
    auditLogs: () => where(db.auditLogs),

    // -- Consultas derivadas frecuentes --
    membersByStatus: (status: MemberStatus) => members().filter((m) => m.status === status),
    membersByRisk: (risk: RiskLevel) => members().filter((m) => m.riskLevel === risk),
    membersWithoutCoach: () => members().filter((m) => m.assignedCoachId === null),

    attendancesByMember: (memberId: ID) =>
      attendances()
        .filter((a) => a.memberId === memberId)
        .sort((a, b) => +new Date(a.classDate) - +new Date(b.classDate)),

    checkInsByMember: (memberId: ID) =>
      where(db.checkIns).filter((c) => c.memberId === memberId),

    tasksByStatus: (status: TaskStatus) => tasks().filter((t) => t.status === status),
    tasksByMember: (memberId: ID) => tasks().filter((t) => t.memberId === memberId),
    tasksByUser: (userId: ID) => tasks().filter((t) => t.assignedToUserId === userId),

    openAlerts: () => alerts().filter((a) => a.status === "open"),
    alertsByMember: (memberId: ID) => alerts().filter((a) => a.memberId === memberId),
    alertsByStatus: (status: AlertStatus) => alerts().filter((a) => a.status === status),

    template: (id: ID) => templates().find((t) => t.id === id),
    messageLogsByMember: (memberId: ID) =>
      where(db.messageLogs).filter((l) => l.memberId === memberId),

    // -- Relaciones member <-> coach --
    coachOfMember: (memberId: ID): CoachProfile | undefined => {
      const m = members().find((x) => x.id === memberId);
      return m?.assignedCoachId ? coachProfiles().find((c) => c.id === m.assignedCoachId) : undefined;
    },
    membersOfCoach: (coachId: ID) => members().filter((m) => m.assignedCoachId === coachId),
    userOfCoach: (coachId: ID): User | undefined => {
      const cp = coachProfiles().find((c) => c.id === coachId);
      return cp ? users().find((u) => u.id === cp.userId) : undefined;
    },

    // -- Carga por coach (socios activos / máximo permitido) --
    coachLoad: (coachId: ID): number => {
      const cp = coachProfiles().find((c) => c.id === coachId);
      if (!cp || cp.maxActiveNewMembers === 0) return 0;
      const active = members().filter(
        (m) => m.assignedCoachId === coachId && m.status !== "completed" && m.status !== "churned",
      ).length;
      return Math.min(active / cp.maxActiveNewMembers, 1);
    },
  };
}

export type OrgScope = ReturnType<typeof orgScope>;
