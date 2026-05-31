import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { memberService } from "@/server/services/member.service";
import { assignCoachSchema } from "@/server/schemas/member.schema";

export const dynamic = "force-dynamic";

export function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const { coachId } = assignCoachSchema.parse(await req.json());
    return ok(memberService.assignCoach(ctx, params.id, coachId));
  });
}
