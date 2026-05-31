/* Almacén mutable en memoria sobre el seed. Los repositorios escriben aquí.
   Cuando se migre a Prisma/Supabase, los repositorios cambian de implementación
   y este archivo desaparece sin afectar a servicios ni a la UI. */
import { db as seed } from "./seed";
import type { Database } from "../types";

// Copia profunda para no mutar las constantes del seed entre recargas de módulo.
export const store: Database = structuredClone(seed);

let counter = 1000;
export function genId(prefix: string): string {
  return `${prefix}_${(++counter).toString(36)}`;
}

export function nowISO(): string {
  // En la demo el "ahora" sigue anclado para consistencia con el seed.
  return new Date("2026-05-30T09:00:00.000Z").toISOString();
}
