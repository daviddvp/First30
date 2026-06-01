import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { settingsService } from "@/server/services/settings.service";
import { updateSettingsSchema } from "@/server/schemas/settings.schema";

export const dynamic = "force-dynamic";
export function GET(req: NextRequest) {
  return handle(async () => ok(await settingsService.get(getRequestContext(req))));
}
export function PATCH(req: NextRequest) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const patch = updateSettingsSchema.parse(await req.json());
    return ok(await settingsService.update(ctx, patch));
  });
}
