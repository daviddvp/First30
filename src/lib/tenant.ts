/* Resolución del tenant (organizationId) en un único punto.
   En producción se derivaría de la sesión autenticada; aquí se acepta una
   cabecera/parámetro y se valida que la organización existe. */
import type { NextRequest } from "next/server";
import { getOrganization } from "../data/mock-db";
import { ForbiddenError, UnauthorizedError } from "./errors";

const DEFAULT_ORG = "org_centro";

export function resolveOrgId(req: NextRequest): string {
  // Prioridad: cabecera explícita > query param > organización por defecto (demo).
  const fromHeader = req.headers.get("x-organization-id");
  const fromQuery = req.nextUrl.searchParams.get("organizationId");
  const orgId = fromHeader ?? fromQuery ?? DEFAULT_ORG;

  if (!orgId) throw new UnauthorizedError();
  if (!getOrganization(orgId)) throw new ForbiddenError("Organización desconocida");
  return orgId;
}

/** Usuario "actor" para auditoría. En real saldría de la sesión. */
export function resolveActorId(req: NextRequest): string {
  return req.headers.get("x-user-id") ?? "usr_a_owner";
}

/** Org por defecto para server components de la demo (sin request disponible).
    En producción saldría de la sesión del usuario. */
export function resolveDefaultOrg(): string {
  return DEFAULT_ORG;
}
