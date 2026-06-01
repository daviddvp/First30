// ─────────────────────────────────────────────────────────────────────────────
// First30 — Capa de autenticación
//
// getRequestContext(req) es SÍNCRONA en ambos modos:
//
// MOCK_AUTH=true (dev): lee x-user-id → lookup en mock db en memoria.
// MOCK_AUTH=false (prod): el middleware ya cargó los datos del usuario y los
//   escribió en headers x-f30-*. Aquí solo se leen, sin queries.
//
// El organizationId SIEMPRE proviene del usuario autenticado, nunca de params.
// ─────────────────────────────────────────────────────────────────────────────
import type { NextRequest } from "next/server";
import { ForbiddenError, UnauthorizedError } from "./errors";
import type { ID, UserRole } from "../types";
import {
  HEADER_USER_ID, HEADER_USER_ROLE, HEADER_USER_NAME,
  HEADER_USER_ORG, HEADER_COACH_ID,
} from "./auth-headers";

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

const MOCK_AUTH = process.env.MOCK_AUTH === "true";
const DEFAULT_MOCK_USER = "usr_a_owner";

// ── Modo mock (desarrollo local) ──────────────────────────────────────────────
function loadUserFromMock(userId: ID): CurrentUser {
  /* eslint-disable */
  const { rawDb } = require("../data/mock-db") as { rawDb: import("../types").Database };
  /* eslint-enable */
  const u = rawDb.users.find((x) => x.id === userId);
  if (!u) throw new UnauthorizedError("Usuario no encontrado");
  const cp = rawDb.coachProfiles.find((c) => c.userId === u.id);
  return {
    id: u.id, organizationId: u.organizationId, name: u.name, role: u.role,
    coachProfileId: u.role === "coach" ? cp?.id ?? null : null,
  };
}

// ── getRequestContext — firma síncrona mantenida ───────────────────────────────
export function getRequestContext(req: NextRequest): RequestContext {
  if (MOCK_AUTH) {
    const userId = req.headers.get("x-user-id") ?? DEFAULT_MOCK_USER;
    const user = loadUserFromMock(userId);
    // Si viene x-organization-id, debe coincidir con la del usuario.
    const requestedOrg = req.headers.get("x-organization-id");
    if (requestedOrg && requestedOrg !== user.organizationId) {
      throw new ForbiddenError("No puedes acceder a otra organización");
    }
    return { organizationId: user.organizationId, user };
  }

  // Modo producción: leer datos escritos por el middleware
  const userId = req.headers.get(HEADER_USER_ID);
  if (!userId) throw new UnauthorizedError("No autenticado");

  const role = req.headers.get(HEADER_USER_ROLE) as UserRole | null;
  const name = req.headers.get(HEADER_USER_NAME) ?? "";
  const organizationId = req.headers.get(HEADER_USER_ORG);
  const coachProfileId = req.headers.get(HEADER_COACH_ID) ?? null;

  if (!role || !organizationId) {
    throw new UnauthorizedError("Contexto de autenticación incompleto");
  }

  return {
    organizationId,
    user: { id: userId, organizationId, name, role, coachProfileId },
  };
}

// ── contextForUser — para tests / scripts / server actions ────────────────────
export function contextForUser(userId: ID): RequestContext {
  if (!MOCK_AUTH) {
    throw new Error("contextForUser solo disponible con MOCK_AUTH=true");
  }
  const user = loadUserFromMock(userId);
  return { organizationId: user.organizationId, user };
}

// ── contextForUserAsync — para server actions en producción ───────────────────
export async function contextForUserAsync(userId: ID): Promise<RequestContext> {
  if (MOCK_AUTH) return contextForUser(userId);
  const { prisma } = await import("./db");
  const u = await prisma.user.findFirst({
    where: { id: userId },
    include: { coachProfile: { select: { id: true } } },
  });
  if (!u) throw new UnauthorizedError("Usuario no encontrado");
  const user: CurrentUser = {
    id: u.id, organizationId: u.organizationId, name: u.name,
    role: u.role as UserRole,
    coachProfileId: u.role === "coach" ? u.coachProfile?.id ?? null : null,
  };
  return { organizationId: u.organizationId, user };
}
