/* Capa de autenticación MOCK. En producción se reemplaza por la sesión real
   (Auth.js/Clerk/Supabase). Resuelve el usuario actual y su organización a
   partir de cabeceras de la request, validando que el usuario existe y que
   pertenece a la organización solicitada (anti cross-tenant). */
import type { NextRequest } from "next/server";
import { rawDb, getOrganization } from "../data/mock-db";
import { ForbiddenError, UnauthorizedError } from "./errors";
import type { ID, UserRole, CoachProfile } from "../types";

export interface CurrentUser {
  id: ID;
  organizationId: ID;
  name: string;
  role: UserRole;
  /** CoachProfile.id si el usuario es coach; null en otro caso. */
  coachProfileId: ID | null;
}

export interface RequestContext {
  organizationId: ID;
  user: CurrentUser;
}

const DEFAULT_USER = "usr_a_owner";

function coachProfileForUser(userId: ID): CoachProfile | undefined {
  return rawDb.coachProfiles.find((c) => c.userId === userId);
}

/** Construye el CurrentUser desde un userId (mock). */
export function loadUser(userId: ID): CurrentUser {
  const u = rawDb.users.find((x) => x.id === userId);
  if (!u) throw new UnauthorizedError("Usuario no encontrado");
  return {
    id: u.id, organizationId: u.organizationId, name: u.name, role: u.role,
    coachProfileId: u.role === "coach" ? coachProfileForUser(u.id)?.id ?? null : null,
  };
}

/** Deriva el contexto de la request. El organizationId SIEMPRE proviene del
    usuario autenticado, no de un parámetro manipulable: así un usuario no puede
    pedir datos de otra organización cambiando una cabecera. */
export function getRequestContext(req: NextRequest): RequestContext {
  const userId = req.headers.get("x-user-id") ?? DEFAULT_USER;
  const user = loadUser(userId);

  // Si llega x-organization-id, debe coincidir con la del usuario.
  const requestedOrg = req.headers.get("x-organization-id");
  if (requestedOrg && requestedOrg !== user.organizationId) {
    throw new ForbiddenError("No puedes acceder a otra organización");
  }
  if (!getOrganization(user.organizationId)) {
    throw new ForbiddenError("Organización desconocida");
  }
  return { organizationId: user.organizationId, user };
}

/** Variante para tests / server components: contexto directo desde userId. */
export function contextForUser(userId: ID): RequestContext {
  const user = loadUser(userId);
  return { organizationId: user.organizationId, user };
}
