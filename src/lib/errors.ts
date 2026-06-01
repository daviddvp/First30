/* Errores de dominio centralizados. Cada uno mapea a un código y un HTTP status,
   de modo que los route handlers no repiten lógica de manejo. */

export type ErrorCode =
  | "VALIDATION_ERROR" | "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN"
  | "CONFLICT" | "RULE_VIOLATION" | "INTERNAL"
  | "TENANT_SCOPE_ERROR" | "DATABASE_ERROR" | "JOB_UNAUTHORIZED";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "Los datos enviados no son válidos", details?: unknown) {
    super("VALIDATION_ERROR", message, 422, details);
  }
}
export class NotFoundError extends AppError {
  constructor(entity = "Recurso") {
    super("NOT_FOUND", `${entity} no encontrado`, 404);
  }
}
export class UnauthorizedError extends AppError {
  constructor(message = "No autenticado") {
    super("UNAUTHORIZED", message, 401);
  }
}
export class ForbiddenError extends AppError {
  constructor(message = "Sin permisos para esta organización") {
    super("FORBIDDEN", message, 403);
  }
}
export class RuleViolationError extends AppError {
  constructor(message: string) {
    super("RULE_VIOLATION", message, 409);
  }
}
export class TenantScopeError extends AppError {
  constructor(message = "Acceso fuera del scope de la organización") {
    super("TENANT_SCOPE_ERROR", message, 403);
  }
}
export class DatabaseError extends AppError {
  constructor(message = "Error de base de datos", details?: unknown) {
    super("DATABASE_ERROR", message, 500, details);
  }
}
export class JobUnauthorizedError extends AppError {
  constructor(message = "Job secret inválido o ausente") {
    super("JOB_UNAUTHORIZED", message, 401);
  }
}
