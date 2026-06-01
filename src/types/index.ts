/* ============================================================================
   First30 — Modelo de datos conceptual (multi-tenant por organizationId)
   Convención de relaciones entre coaches:
     - Member.assignedCoachId  -> CoachProfile.id (nullable)
     - Attendance.coachId      -> CoachProfile.id
     - CheckIn.coachId         -> CoachProfile.id (nullable)
     - Task.assignedToUserId   -> User.id  (puede ser coach o manager)
     - MessageLog.sentByUserId -> User.id
     - AuditLog.actorUserId    -> User.id
   Todas las marcas de tiempo son ISO 8601 (string) para facilitar la
   migración a PostgreSQL/Supabase/Prisma sin perder precisión.
   ========================================================================== */

export type ID = string;
export type ISODate = string;

export type UserRole = "owner" | "manager" | "coach";
export type MemberStatus =
  | "in_progress" | "at_risk" | "activated" | "no_coach" | "completed" | "churned";
export type RiskLevel = "high" | "medium" | "low";
export type MemberLevel = "beginner" | "intermediate" | "advanced";
export type Priority = "low" | "medium" | "high";
export type TaskStatus = "today" | "this_week" | "pending" | "completed" | "cancelled";
export type CheckInStatus = "pending" | "sent" | "responded" | "missed";
export type AlertStatus = "open" | "snoozed" | "resolved";
export type MessageChannel = "whatsapp" | "email" | "sms";
export type MessageStatus = "draft" | "copied" | "sent" | "failed";
export type OnboardingRuleType =
  | "no_return_7d" | "low_attendance_14d" | "no_coach" | "checkin_no_response";
export type AuditAction =
  | "created" | "updated" | "deleted" | "assigned_coach" | "resolved_alert"
  | "sent_message" | "completed_task" | "generated_report"
  | "job_run" | "score_updated" | "contacted";

export interface Organization {
  id: ID;
  name: string;
  slug: string;
  timezone: string;
  brandingColor: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface User {
  id: ID;
  organizationId: ID;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface CoachProfile {
  id: ID;
  userId: ID;
  organizationId: ID;
  specialties: string[];
  maxActiveNewMembers: number;
  active: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Member {
  id: ID;
  organizationId: ID;
  fullName: string;
  email: string;
  phone: string;
  joinDate: ISODate;
  onboardingDay: number;
  status: MemberStatus;
  riskLevel: RiskLevel;
  riskReason: string | null;
  mainGoal: string;
  level: MemberLevel;
  limitations: string | null;
  fears: string | null;
  acquisitionSource: string;
  assignedCoachId: ID | null;
  lastAttendanceAt: ISODate | null;
  nextRecommendedAction: string;
  activationScore: number; // 0–100
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Attendance {
  id: ID;
  organizationId: ID;
  memberId: ID;
  classDate: ISODate;
  classType: string;
  coachId: ID;
  notes: string | null;
  createdAt: ISODate;
}

export interface CheckIn {
  id: ID;
  organizationId: ID;
  memberId: ID;
  coachId: ID | null;
  day: number;
  status: CheckInStatus;
  sentiment: "positive" | "neutral" | "negative" | null;
  notes: string | null;
  createdAt: ISODate;
}

export interface Task {
  id: ID;
  organizationId: ID;
  memberId: ID | null;
  assignedToUserId: ID | null;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  dueDate: ISODate | null;
  completedAt: ISODate | null;
  /** Clave lógica para deduplicación del job de reglas. */
  ruleKey: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface RiskAlert {
  id: ID;
  organizationId: ID;
  memberId: ID;
  riskLevel: RiskLevel;
  reason: string;
  daysSinceLastAttendance: number | null;
  suggestedAction: string | null;
  suggestedMessage: ID | null; // -> MessageTemplate.id
  priority: Priority;
  status: AlertStatus;
  resolvedAt: ISODate | null;
  resolvedNote: string | null;
  snoozeUntil: ISODate | null;
  /** Clave lógica para deduplicación del job de reglas. */
  ruleKey: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface MessageTemplate {
  id: ID;
  organizationId: ID;
  category: string;
  title: string;
  body: string;
  variables: string[];
  active: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface MessageLog {
  id: ID;
  organizationId: ID;
  memberId: ID;
  templateId: ID | null;
  sentByUserId: ID;
  channel: MessageChannel;
  body: string;
  status: MessageStatus;
  copiedAt: ISODate | null;
  sentAt: ISODate | null;
  createdAt: ISODate;
}

export interface OnboardingRule {
  id: ID;
  organizationId: ID;
  type: OnboardingRuleType;
  enabled: boolean;
  thresholdValue: number;
  action: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface WeeklyReport {
  id: ID;
  organizationId: ID;
  weekStart: ISODate;
  weekEnd: ISODate;
  metricsJson: WeeklyMetrics;
  summary: string;
  createdAt: ISODate;
}

export interface WeeklyMetrics {
  newMembers: number;
  secondVisits: number;
  activated: number;
  noSecondVisit: number;
  noReturn: number;
  noCoach: number;
  day30Completed: number;
  tasksCompleted: number;
  secondVisitRate: number; // 0–1
  activationRate: number;  // 0–1
  avgAttendanceFirst14: number;
  atRisk: number;
}

export interface AuditLog {
  id: ID;
  organizationId: ID;
  actorUserId: ID;
  entityType: string;
  entityId: ID;
  action: AuditAction;
  metadata: Record<string, unknown> | null;
  createdAt: ISODate;
}

/** Forma del conjunto de datos completo (mock-db / futuro repositorio). */
export interface Database {
  organizations: Organization[];
  users: User[];
  coachProfiles: CoachProfile[];
  members: Member[];
  attendances: Attendance[];
  checkIns: CheckIn[];
  tasks: Task[];
  alerts: RiskAlert[];
  messageTemplates: MessageTemplate[];
  messageLogs: MessageLog[];
  onboardingRules: OnboardingRule[];
  weeklyReports: WeeklyReport[];
  auditLogs: AuditLog[];
}
