/* Utilidades de fecha. NOW es fijo para que el seed sea determinista. */
import type { ISODate } from "../types";

export const NOW = new Date("2026-05-30T09:00:00.000Z");

export function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
export function daysAgo(n: number, base: Date = NOW): Date {
  return addDays(base, -n);
}
export function toISO(d: Date): ISODate {
  return d.toISOString();
}
export function isoDaysAgo(n: number, base: Date = NOW): ISODate {
  return toISO(daysAgo(n, base));
}
export function isoDaysAhead(n: number, base: Date = NOW): ISODate {
  return toISO(addDays(base, n));
}
export function daysBetween(a: Date | string, b: Date | string = NOW): number {
  const da = typeof a === "string" ? new Date(a) : a;
  const db = typeof b === "string" ? new Date(b) : b;
  return Math.floor((db.getTime() - da.getTime()) / 86_400_000);
}
/** Lunes de la semana de `d` (00:00 UTC). */
export function startOfWeek(d: Date = NOW): Date {
  const r = new Date(d);
  const day = (r.getUTCDay() + 6) % 7; // 0 = lunes
  r.setUTCHours(0, 0, 0, 0);
  return addDays(r, -day);
}
export function endOfWeek(d: Date = NOW): Date {
  return addDays(startOfWeek(d), 6);
}
