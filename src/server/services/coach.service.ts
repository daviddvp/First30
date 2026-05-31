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
  list(ctx: RequestContext): CoachView[] {
    assertCan(ctx.user, "member.read");
    return coachRepository.list(ctx.organizationId).map((c) => {
      const members = coachRepository.membersOfCoach(ctx.organizationId, c.id);
      return {
        ...c, memberCount: members.length,
        atRiskCount: members.filter((m) => m.status === "at_risk").length,
        load: coachRepository.load(ctx.organizationId, c.id),
        userName: coachRepository.userOf(ctx.organizationId, c.id)?.name ?? null,
      };
    });
  },

  get(ctx: RequestContext, id: ID): CoachView {
    assertCan(ctx.user, "member.read");
    const c = coachRepository.findById(ctx.organizationId, id);
    if (!c) throw new NotFoundError("Coach");
    const members = coachRepository.membersOfCoach(ctx.organizationId, id);
    return {
      ...c, memberCount: members.length,
      atRiskCount: members.filter((m) => m.status === "at_risk").length,
      load: coachRepository.load(ctx.organizationId, id),
      userName: coachRepository.userOf(ctx.organizationId, id)?.name ?? null,
    };
  },

  todayMembers(ctx: RequestContext, id: ID): TodayMember[] {
    assertCan(ctx.user, "member.read");
    if (!coachRepository.findById(ctx.organizationId, id)) throw new NotFoundError("Coach");
    return coachRepository.membersOfCoach(ctx.organizationId, id)
      .filter((m) => m.status !== "completed" && m.status !== "churned")
      .map((member) => ({ member, suggestedAction: actionFor(member) }));
  },
};
