/** Une clases condicionalmente (alternativa mínima a clsx, sin dependencias). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Formatea un ratio 0–1 como porcentaje entero. */
export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}
