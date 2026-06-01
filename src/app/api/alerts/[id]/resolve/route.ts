import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { alertService } from "@/server/services/alert.service";
import { resolveAlertSchema } from "@/server/schemas/alert.schema";

export const dynamic = "force-dynamic";
export function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const { note } = resolveAlertSchema.parse(await req.json().catch(() => ({})));
    return ok(await alertService.resolve(ctx, params.id, note));
  });
}
