import { prisma } from "@/lib/db";
import type { ID, Member, MemberStatus, RiskLevel } from "@/types";

export interface MemberFilters {
  status?: MemberStatus;
  riskLevel?: RiskLevel;
  coachId?: ID;
  search?: string;
  onboardingMin?: number;
  onboardingMax?: number;
}

export const memberRepository = {
  async list(orgId: ID, f: MemberFilters = {}): Promise<Member[]> {
    const rows = await prisma.member.findMany({
      where: {
        organizationId: orgId,
        ...(f.status    && { status:   f.status }),
        ...(f.riskLevel && { riskLevel: f.riskLevel }),
        ...(f.coachId   && { assignedCoachId: f.coachId }),
        ...(f.onboardingMin != null && { onboardingDay: { gte: f.onboardingMin } }),
        ...(f.onboardingMax != null && { onboardingDay: { lte: f.onboardingMax } }),
        ...(f.search && {
          OR: [
            { fullName: { contains: f.search, mode: "insensitive" } },
            { mainGoal: { contains: f.search, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { onboardingDay: "asc" },
    });
    return rows.map(toMember);
  },

  async findById(orgId: ID, id: ID): Promise<Member | undefined> {
    const row = await prisma.member.findFirst({
      where: { id, organizationId: orgId },
    });
    return row ? toMember(row) : undefined;
  },

  async create(
    orgId: ID,
    data: Omit<Member, "id" | "organizationId" | "createdAt" | "updatedAt" | "ruleKey">,
  ): Promise<Member> {
    const row = await prisma.member.create({
      data: {
        organizationId: orgId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        joinDate: new Date(data.joinDate),
        onboardingDay: data.onboardingDay,
        status: data.status,
        riskLevel: data.riskLevel,
        riskReason: data.riskReason ?? null,
        mainGoal: data.mainGoal ?? null,
        level: data.level,
        limitations: data.limitations ?? null,
        fears: data.fears ?? null,
        acquisitionSource: data.acquisitionSource ?? null,
        assignedCoachId: data.assignedCoachId ?? null,
        lastAttendanceAt: data.lastAttendanceAt ? new Date(data.lastAttendanceAt) : null,
        nextRecommendedAction: data.nextRecommendedAction ?? null,
        activationScore: data.activationScore,
      },
    });
    return toMember(row);
  },

  async update(orgId: ID, id: ID, patch: Partial<Member>): Promise<Member | undefined> {
    const exists = await prisma.member.findFirst({ where: { id, organizationId: orgId }, select: { id: true } });
    if (!exists) return undefined;

    const row = await prisma.member.update({
      where: { id },
      data: {
        ...(patch.fullName             !== undefined && { fullName: patch.fullName }),
        ...(patch.email                !== undefined && { email: patch.email }),
        ...(patch.phone                !== undefined && { phone: patch.phone }),
        ...(patch.status               !== undefined && { status: patch.status }),
        ...(patch.riskLevel            !== undefined && { riskLevel: patch.riskLevel }),
        ...(patch.riskReason           !== undefined && { riskReason: patch.riskReason }),
        ...(patch.mainGoal             !== undefined && { mainGoal: patch.mainGoal }),
        ...(patch.level                !== undefined && { level: patch.level }),
        ...(patch.limitations          !== undefined && { limitations: patch.limitations }),
        ...(patch.fears                !== undefined && { fears: patch.fears }),
        ...(patch.assignedCoachId      !== undefined && { assignedCoachId: patch.assignedCoachId }),
        ...(patch.lastAttendanceAt     !== undefined && {
          lastAttendanceAt: patch.lastAttendanceAt ? new Date(patch.lastAttendanceAt) : null,
        }),
        ...(patch.nextRecommendedAction !== undefined && { nextRecommendedAction: patch.nextRecommendedAction }),
        ...(patch.activationScore      !== undefined && { activationScore: patch.activationScore }),
        ...(patch.onboardingDay        !== undefined && { onboardingDay: patch.onboardingDay }),
      },
    });
    return toMember(row);
  },
};

// Mapper Prisma → domain type (Date → ISODate string)
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
    id: p.id,
    organizationId: p.organizationId,
    fullName: p.fullName,
    email: p.email ?? "",
    phone: p.phone ?? "",
    joinDate: p.joinDate.toISOString(),
    onboardingDay: p.onboardingDay,
    status: p.status as Member["status"],
    riskLevel: p.riskLevel as Member["riskLevel"],
    riskReason: p.riskReason,
    mainGoal: p.mainGoal ?? "",
    level: p.level as Member["level"],
    limitations: p.limitations,
    fears: p.fears,
    acquisitionSource: p.acquisitionSource ?? "",
    assignedCoachId: p.assignedCoachId,
    lastAttendanceAt: p.lastAttendanceAt?.toISOString() ?? null,
    nextRecommendedAction: p.nextRecommendedAction ?? "",
    activationScore: p.activationScore,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
