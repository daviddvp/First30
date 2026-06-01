// ─────────────────────────────────────────────────────────────────────────────
// First30 — Capa de analítica de eventos
//
// Abstracción lista para conectar con PostHog, Plausible, Segment, etc.
// Por ahora registra en console (dev) y en el AuditLog del servidor.
//
// Uso:
//   trackEvent("member_import_confirmed", { organizationId, userId, created, ... })
//
// Para conectar un proveedor externo en el futuro, añade el cliente
// en la función `sendToProvider` y llámalo desde `trackEvent`.
// ─────────────────────────────────────────────────────────────────────────────

export type EventName =
  | "member_import_started"
  | "member_import_preview_generated"
  | "member_import_confirmed"
  | "member_import_failed"
  | "risk_alert_created"
  | "risk_alert_resolved"
  | "task_created"
  | "task_completed"
  | "message_template_copied"
  | "member_marked_contacted"
  | "member_assigned_coach"
  | "weekly_report_copied"
  | "weekly_report_generated";

export interface BaseEventProps {
  organizationId: string;
  userId?: string;
  role?: string;
}

export interface ImportEventProps extends BaseEventProps {
  totalRows?: number;
  created?: number;
  updated?: number;
  ignored?: number;
  errors?: number;
  warnings?: number;
  fileName?: string;
}

export interface TaskEventProps extends BaseEventProps {
  taskId?: string;
  memberId?: string;
  priority?: string;
  source?: "manual" | "import" | "rule_engine";
}

export interface AlertEventProps extends BaseEventProps {
  alertId?: string;
  memberId?: string;
  riskLevel?: string;
  reason?: string;
  source?: "import" | "rule_engine" | "manual";
}

export interface MessageEventProps extends BaseEventProps {
  templateId?: string;
  memberId?: string;
  category?: string;
}

export type EventProps =
  | BaseEventProps
  | ImportEventProps
  | TaskEventProps
  | AlertEventProps
  | MessageEventProps;

/** Registra un evento de analítica.
    En producción, llama también a sendToProvider() con el proveedor configurado. */
export function trackEvent(event: EventName, props: EventProps): void {
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    ...props,
  };

  // Dev: log a console
  if (process.env.NODE_ENV === "development") {
    console.log("[analytics]", payload);
  }

  // Enviar a proveedor externo (descomentar cuando se configure)
  // sendToProvider(payload);
}

/** Stub para conectar un proveedor externo en el futuro.
    Reemplazar con PostHog, Plausible, Segment, etc. */
// function sendToProvider(payload: Record<string, unknown>): void {
//   // Ejemplo PostHog:
//   // posthog.capture(payload.event as string, payload);
//
//   // Ejemplo Segment:
//   // analytics.track(payload.event as string, payload);
// }

// ─── Helpers de uso frecuente ─────────────────────────────────────────────────

/** Registra evento desde el servidor (usa el RequestContext disponible). */
export function trackServerEvent(
  event: EventName,
  ctx: { organizationId: string; user: { id: string; role: string } },
  extra?: Record<string, unknown>,
): void {
  trackEvent(event, {
    organizationId: ctx.organizationId,
    userId: ctx.user.id,
    role: ctx.user.role,
    ...extra,
  } as EventProps);
}
