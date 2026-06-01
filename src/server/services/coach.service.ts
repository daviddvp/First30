import { coachRepository } from "../repositories/coach.repository";
import { NotFoundError } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";
import type { RequestContext } from "@/lib/auth";
import type { ID, CoachProfile, Member } from "@/types";

export interface CoachView extends CoachProfile {
  memberCount: number;
  atRiskCount: number;
  load: number;
  userName: string | null;
}
export interface TodayMember { member: Member; suggestedAction: string; }

function actionFor(m: Member): string {
  if (m.limitations?.toLowerCase().includes("lesión")) return "Revisar escalados antes de la clase";
  if (m.status === "at_risk") return "Saludar antes de clase y recomendar segunda sesión";
  return "Recomendar próxima clase según objetivo";
}

export const coachService = {
  async list(ctx: RequestContext): Promise<CoachView[]> {
    assertCan(ctx.user, "member.read");
    const coaches = await coachRepository.list(ctx.organizationId);
    return Promise.all(coaches.map(async (c) => {
      const [members, load, userRow] = await Promise.all([
        coachRepository.membersOfCoach(ctx.organizationId, c.id),
        coachRepository.load(ctx.organizationId, c.id),
        coachRepository.userOf(ctx.organizationId, c.id),
      ]);
      return {
        ...c, memberCount: members.length,
        atRiskCount: members.filter((m) => m.status === "at_risk").length,
        load, userName: userRow?.name ?? null,
      };
    }));
  },

  async get(ctx: RequestContext, id: ID): Promise<CoachView> {
    assertCan(ctx.user, "member.read");
    const c = await coachRepository.findById(ctx.organizationId, id);
    if (!c) throw new NotFoundError("Coach");
    const [members, load, userRow] = await Promise.all([
      coachRepository.membersOfCoach(ctx.organizationId, id),
      coachRepository.load(ctx.organizationId, id),
      coachRepository.userOf(ctx.organizationId, id),
    ]);
    return {
      ...c, memberCount: members.length,
      atRiskCount: members.filter((m) => m.status === "at_risk").length,
      load, userName: userRow?.name ?? null,
    };
  },

  async todayMembers(ctx: RequestContext, id: ID): Promise<TodayMember[]> {
    assertCan(ctx.user, "member.read");
    const c = await coachRepository.findById(ctx.organizationId, id);
    if (!c) throw new NotFoundError("Coach");
    const members = await coachRepository.membersOfCoach(ctx.organizationId, id);
    return members
      .filter((m) => m.status !== "completed" && m.status !== "churned")
      .map((member) => ({ member, suggestedAction: actionFor(member) }));
  },
};
