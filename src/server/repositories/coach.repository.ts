import { prisma } from "@/lib/db";
import type { ID, CoachProfile, Member } from "@/types";

export const coachRepository = {
  async list(orgId: ID): Promise<CoachProfile[]> {
    const rows = await prisma.coachProfile.findMany({
      where: { organizationId: orgId, active: true },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toCoachProfile);
  },

  async findById(orgId: ID, id: ID): Promise<CoachProfile | undefined> {
    const row = await prisma.coachProfile.findFirst({
      where: { id, organizationId: orgId },
    });
    return row ? toCoachProfile(row) : undefined;
  },

  async membersOfCoach(orgId: ID, coachId: ID): Promise<Member[]> {
    const rows = await prisma.member.findMany({
      where: { organizationId: orgId, assignedCoachId: coachId },
    });
    return rows.map(toMember);
  },

  async load(orgId: ID, coachId: ID): Promise<number> {
    const [total, assigned] = await Promise.all([
      prisma.coachProfile.findFirst({ where: { id: coachId, organizationId: orgId }, select: { maxActiveNewMembers: true } }),
      prisma.member.count({ where: { organizationId: orgId, assignedCoachId: coachId, status: { in: ["in_progress", "at_risk"] } } }),
    ]);
    if (!total) return 0;
    return Math.round((assigned / total.maxActiveNewMembers) * 100);
  },

  async userOf(orgId: ID, coachId: ID) {
    return prisma.user.findFirst({
      where: { coachProfile: { id: coachId }, organizationId: orgId },
      select: { id: true, name: true, email: true, role: true },
    });
  },
};

function toCoachProfile(p: {
  id: string; userId: string; organizationId: string; specialties: string[];
  maxActiveNewMembers: number; active: boolean; createdAt: Date; updatedAt: Date;
}): CoachProfile {
  return {
    id: p.id, userId: p.userId, organizationId: p.organizationId,
    specialties: p.specialties, maxActiveNewMembers: p.maxActiveNewMembers,
    active: p.active, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(),
  };
}

function toMember(p: {
  id: string; organizationId: string; fullName: string; email: string | null;
  phone: string | null; joinDate: Date; onboardingDay: number;
  status: string; riskLevel: string; riskReason: string | null;
  mainGoal: string | null; level: string; limitations: string | null;
  fears: string | null; acquisitionSource: string | null;
  assignedCoachId: string | null; lastAttendanceAt: Date | null;
  nextRecommendedAction: string | null; activationScore: number;
  createdAt: Date; updatedAt: Date;
}): Member {
  return {
    id: p.id, organizationId: p.organizationId, fullName: p.fullName,
    email: p.email ?? "", phone: p.phone ?? "",
    joinDate: p.joinDate.toISOString(), onboardingDay: p.onboardingDay,
    status: p.status as Member["status"], riskLevel: p.riskLevel as Member["riskLevel"],
    riskReason: p.riskReason, mainGoal: p.mainGoal ?? "", level: p.level as Member["level"],
    limitations: p.limitations, fears: p.fears, acquisitionSource: p.acquisitionSource ?? "",
    assignedCoachId: p.assignedCoachId, lastAttendanceAt: p.lastAttendanceAt?.toISOString() ?? null,
    nextRecommendedAction: p.nextRecommendedAction ?? "", activationScore: p.activationScore,
    createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(),
  };
}
