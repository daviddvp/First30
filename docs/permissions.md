# Permisos (RBAC) y multi-tenant

Tres capas: `auth.ts` (quién), `permissions.ts` (qué puede), `tenant-scope.ts` (sobre qué datos).

## Roles y matriz
| Acción | owner | manager | coach |
|---|---|---|---|
| member.read | ✓ | ✓ | ✓ (solo suyos) |
| member.create / update | ✓ | ✓ | update solo suyos |
| member.assignCoach | ✓ | ✓ | ✗ |
| task.read | ✓ | ✓ | ✓ (suyas) |
| task.create | ✓ | ✓ | ✗ |
| task.complete | ✓ | ✓ | ✓ (asignadas a él) |
| alert.read / resolve | ✓ | ✓ | read sí; resolve no |
| settings.read | ✓ | ✓ | ✗ |
| settings.update | ✓ | ✗ | ✗ |
| report.read | ✓ | ✓ | ✓ (digest propio) |
| report.generate | ✓ | ✓ | ✗ |
| message.use | ✓ | ✓ | ✓ (de sus socios) |
| coach.create | ✓ | ✗ | ✗ |

## Función central
`can(user, action, resource?)` → boolean. `assertCan(...)` lanza `ForbiddenError`.
El `resource` permite matices de ownership: el coach solo accede a recursos de sus socios
y solo completa tareas asignadas a él.

## Aislamiento de tenant
- El `organizationId` SIEMPRE proviene del usuario autenticado (`getRequestContext`), nunca
  de un parámetro manipulable. Si se envía `x-organization-id` distinto, se rechaza con 403.
- `scopedView(ctx)`: owner/manager ven todo dentro de su org; coach solo sus socios, sus
  tareas y las alertas de sus socios.
- Ningún repositorio devuelve datos globales: todas las consultas pasan por `orgScope(orgId)`.

## Limitaciones actuales
Auth mock (cabecera `x-user-id`). Aislamiento en capa de aplicación, no en BD (falta RLS).
Permisos puntuales ("ver socios de otro coach con permiso explícito") modelados pero sin
mecanismo de concesión. Sin billing real.
