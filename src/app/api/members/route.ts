import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { memberService } from "@/server/services/member.service";
import { memberListQuerySchema, createMemberSchema } from "@/server/schemas/member.schema";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const q = memberListQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    return ok(memberService.list(ctx, q));
  });
}
export function POST(req: NextRequest) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const input = createMemberSchema.parse(await req.json());
    return ok(memberService.create(ctx, input), 201);
  });
}
