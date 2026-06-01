import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { memberService } from "@/server/services/member.service";
import { updateMemberSchema } from "@/server/schemas/member.schema";

export const dynamic = "force-dynamic";
type Ctx = { params: { id: string } };

export function GET(req: NextRequest, { params }: Ctx) {
  return handle(async () => ok(await memberService.get(getRequestContext(req), params.id)));
}
export function PATCH(req: NextRequest, { params }: Ctx) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const patch = updateMemberSchema.parse(await req.json());
    return ok(await memberService.update(ctx, params.id, patch));
  });
}
