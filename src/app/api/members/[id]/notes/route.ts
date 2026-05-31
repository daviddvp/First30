import type { NextRequest } from "next/server";
import { z } from "zod";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { noteService } from "@/server/services/note.service";

export const dynamic = "force-dynamic";
const addNoteSchema = z.object({ body: z.string().min(1, "La nota no puede estar vacía").max(1000) });

export function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => ok(noteService.list(getRequestContext(req), params.id)));
}
export function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const { body } = addNoteSchema.parse(await req.json());
    return ok(noteService.add(ctx, params.id, body), 201);
  });
}
