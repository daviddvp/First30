// Cliente Supabase para uso en servidor (Server Components, Route Handlers, middleware).
// Lee/escribe cookies de Next.js para mantener la sesión.
// NUNCA importar en código cliente/browser.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll puede fallar en Server Components (solo lectura).
            // Middleware se encarga de refrescar la sesión correctamente.
          }
        },
      },
    }
  );
}

// Cliente con service role para operaciones admin (bypass RLS).
// Solo usar en servidor — NUNCA exponer al cliente.
export function createSupabaseAdminClient() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
