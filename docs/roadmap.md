# Roadmap

## Estado actual (MVP técnico)
App navegable con 8 pantallas, API en capas, motores de negocio puros, RBAC + multi-tenant,
UX con estados y feedback, informe semanal avanzado y audit log. Datos mock en memoria.

## Próximos pasos
### Infraestructura de datos
- [ ] Base de datos real (PostgreSQL).
- [ ] Prisma como ORM; migrar repositorios (mismas firmas).
- [ ] Supabase como backend gestionado (DB + auth + storage).
- [ ] **RLS / tenant isolation** a nivel de BD (defensa en profundidad sobre la app).

### Autenticación
- [ ] Auth real (Auth.js / Clerk / Supabase Auth).
- [ ] Sesión → `RequestContext` (sustituir cabecera mock).
- [ ] Onboarding de organizaciones (alta de box, invitar equipo).

### Integraciones
- [ ] Software de reservas (ingesta de asistencias por webhook/import).
- [ ] WhatsApp Business API / email provider (Resend) con tracking.
- [ ] Cron jobs: evaluar reglas a diario y generar alertas/tareas.
- [ ] Generación real de informes PDF (server-side) y envío programado.

### Negocio y operación
- [ ] Billing SaaS (Stripe): planes, límites por plan.
- [ ] Observabilidad (logs estructurados, métricas, alertas de error).
- [ ] Backups y retención.
- [ ] Exportación de datos (CSV/JSON) y portabilidad.

## Prioridad sugerida
1. Prisma + Postgres + Supabase Auth + RLS (cimientos).
2. Cron de reglas + persistencia de alertas/tareas (cierra el ciclo del motor).
3. Integración de reservas (mayor riesgo de producto: depende de API de terceros).
4. Mensajería real (WhatsApp/email).
5. Billing + observabilidad.
