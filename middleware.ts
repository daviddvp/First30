// ─────────────────────────────────────────────────────────────────────────────
// First30 — Middleware de autenticación
//
// MODO REAL (MOCK_AUTH != "true"):
//   1. Elimina cualquier header x-f30-* entrante (anti-spoofing).
//   2. Verifica la sesión Supabase desde las cookies.
//   3. Carga User + CoachProfile desde Prisma por supabaseUid.
//   4. Escribe headers x-f30-* con los datos del usuario para que
//      getRequestContext() sea síncrona en los route handlers.
//   5. Redirige a /login si no hay sesión y la ruta es privada.
//
// MODO MOCK (MOCK_AUTH="true"):
//   Pasa el header x-user-id tal cual (o default) para compatibilidad
//   con scripts de test locales. NUNCA usar en producción.
// ─────────────────────────────────────────────────────────────────────────────
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const MOCK_AUTH = process.env.MOCK_AUTH === "true";
const DEFAULT_MOCK_USER = "usr_a_owner";

import {
  HEADER_USER_ID, HEADER_USER_ROLE, HEADER_USER_NAME,
  HEADER_USER_ORG, HEADER_COACH_ID,
} from "@/lib/auth-headers";

// Rutas sin autenticación
const PUBLIC_PATHS = ["/login", "/signup", "/auth/callback", "/_next", "/favicon.ico"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

// Elimina headers internos del cliente (previene spoofing)
function stripInternalHeaders(headers: Headers): void {
  [HEADER_USER_ID, HEADER_USER_ROLE, HEADER_USER_NAME, HEADER_USER_ORG, HEADER_COACH_ID,
   "x-user-id", "x-organization-id"].forEach((h) => headers.delete(h));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const requestHeaders = new Headers(req.headers);
  // Siempre limpiar headers internos entrantes para evitar spoofing
  stripInternalHeaders(requestHeaders);

  // ── MODO MOCK ─────────────────────────────────────────────────────────────
  if (MOCK_AUTH) {
    // Restaurar x-user-id para compatibilidad con getRequestContext mock.
    const userId = req.headers.get("x-user-id") ?? DEFAULT_MOCK_USER;
    requestHeaders.set("x-user-id", userId);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ── MODO REAL ─────────────────────────────────────────────────────────────
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            response = NextResponse.next({ request: { headers: requestHeaders } });
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user: supabaseUser } } = await supabase.auth.getUser();

  if (!supabaseUser) {
    if (!pathname.startsWith("/api/")) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
    // API sin sesión → continúa con headers limpios (route handler devolverá 401)
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Cargar usuario interno + coach profile desde Prisma
  const { prisma } = await import("@/lib/db");
  const internalUser = await prisma.user.findUnique({
    where: { supabaseUid: supabaseUser.id },
    include: { coachProfile: { select: { id: true } } },
  });

  if (!internalUser) {
    // Usuario Supabase sin User interno (no provisionado todavía)
    if (!pathname.startsWith("/api/")) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Escribir todos los datos del usuario en headers internos
  requestHeaders.set(HEADER_USER_ID,   internalUser.id);
  requestHeaders.set(HEADER_USER_ROLE, internalUser.role);
  requestHeaders.set(HEADER_USER_NAME, internalUser.name);
  requestHeaders.set(HEADER_USER_ORG,  internalUser.organizationId);
  if (internalUser.coachProfile?.id) {
    requestHeaders.set(HEADER_COACH_ID, internalUser.coachProfile.id);
  }

  response = NextResponse.next({ request: { headers: requestHeaders } });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
