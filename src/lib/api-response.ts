/* Respuesta API estándar + adaptador a NextResponse con manejo de errores. */
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, ValidationError } from "./errors";

export type ApiResponse<T> = {
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
};

export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, error: null }, { status });
}

export function fail(error: AppError): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { data: null, error: { code: error.code, message: error.message, details: error.details } },
    { status: error.status },
  );
}

/** Envuelve un handler: convierte cualquier excepción en una ApiResponse coherente. */
export function handle<T>(
  fn: () => Promise<NextResponse<ApiResponse<T>>>,
): Promise<NextResponse<ApiResponse<T>>> {
  return fn().catch((err) => {
    if (err instanceof ZodError) {
      return fail(new ValidationError("Los datos enviados no son válidos", err.flatten()));
    }
    if (err instanceof AppError) return fail(err);
    console.error("[First30] Error no controlado:", err);
    return fail(new AppError("INTERNAL", "Error interno del servidor", 500));
  });
}
