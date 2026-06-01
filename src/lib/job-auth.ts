import { JobUnauthorizedError } from "./errors";

/**
 * Verifica el secret del job desde el header Authorization.
 * Lanzar JobUnauthorizedError si el secret es inválido o ausente.
 * El endpoint debe estar protegido con este secret para evitar
 * ejecuciones no autorizadas desde el exterior.
 */
export function verifyJobSecret(authHeader: string | null): void {
  const secret = process.env.JOB_SECRET;
  if (!secret) {
    throw new Error("[First30] JOB_SECRET no configurado. Define la variable de entorno.");
  }
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new JobUnauthorizedError();
  }
  const provided = authHeader.replace("Bearer ", "").trim();
  if (provided !== secret) {
    throw new JobUnauthorizedError();
  }
}
