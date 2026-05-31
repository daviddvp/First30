import { orgScope } from "@/data/mock-db";
import type { ID, CoachProfile, Member } from "@/types";

export const coachRepository = {
  list(orgId: ID): CoachProfile[] {
    return orgScope(orgId).coachProfiles();
  },
  findById(orgId: ID, id: ID): CoachProfile | undefined {
    return orgScope(orgId).coachProfile(id);
  },
  membersOfCoach(orgId: ID, coachId: ID): Member[] {
    return orgScope(orgId).membersOfCoach(coachId);
  },
  load(orgId: ID, coachId: ID): number {
    return orgScope(orgId).coachLoad(coachId);
  },
  userOf(orgId: ID, coachId: ID) {
    return orgScope(orgId).userOfCoach(coachId);
  },
};
