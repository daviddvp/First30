# Autenticación — First30

## Modo MOCK (desarrollo local)

Con `MOCK_AUTH=true`, el sistema usa autenticación simulada:
1. Las rutas API leen el header `x-user-id` de la request.
2. Si no está presente, usa el usuario por defecto `usr_a_owner`.
3. `getRequestContext(req)` carga el usuario desde el store en memoria.
4. Los scripts de test siguen funcionando sin Supabase.

## Modo producción (Supabase Auth)

Con `MOCK_AUTH=false`:
1. El **middleware** (`middleware.ts`) intercepta todas las requests.
2. Verifica la sesión Supabase leyendo las cookies del request.
3. Hace lookup del `User` interno por `supabaseUid` (campo en la tabla `users`).
4. Escribe los datos del usuario en headers internos (`x-f30-*`).
5. `getRequestContext(req)` lee esos headers — sigue siendo **síncrona**.
6. Routes API no cambian: no saben si están en mock o producción.

## Flujo de autenticación en producción

```
Browser → Request con cookies Supabase
  ↓
middleware.ts
  ├─ Elimina headers x-f30-* entrantes (anti-spoofing)
  ├─ createServerClient(supabase) → verifica JWT
  ├─ prisma.user.findUnique({ supabaseUid }) → obtiene User + CoachProfile
  ├─ requestHeaders.set(x-f30-user-id, user.id)
  ├─ requestHeaders.set(x-f30-user-role, user.role)
  ├─ requestHeaders.set(x-f30-user-org, user.organizationId)
  └─ requestHeaders.set(x-f30-coach-id, coachProfile.id) [si coach]
  ↓
Route Handler
  └─ getRequestContext(req) → lee headers → CurrentUser
```

## Mapeo Supabase ↔ Usuario interno

El campo `User.supabaseUid` vincula el `auth.uid()` de Supabase con el usuario interno de First30.

Para provisionar un nuevo usuario:
1. Crear usuario en Supabase Auth (email/password o magic link).
2. Crear el `User` en la tabla de Prisma con `supabaseUid = auth.uid()`.
3. Si es coach, crear también el `CoachProfile`.

El `organizationId` **nunca** viene del cliente. Siempre se deriva del usuario autenticado en el middleware.

## Headers internos

| Header | Descripción |
|--------|-------------|
| `x-f30-user-id` | ID interno del usuario |
| `x-f30-user-role` | Rol: `owner`, `manager`, `coach` |
| `x-f30-user-name` | Nombre del usuario |
| `x-f30-user-org` | organizationId derivado del usuario |
| `x-f30-coach-id` | CoachProfile.id (solo si role=coach) |

## Protección de rutas

- Rutas API sin sesión válida → 401 (sin redirect)
- Páginas sin sesión válida → redirect a `/login`
- Rutas públicas: `/login`, `/signup`, `/auth/callback`

## Páginas UI vs API Routes

Las **API routes** usan `getRequestContext(req)` y están completamente migradas.

Las **páginas UI** (Server Components en `/src/app/`) aún usan `orgScope()` de mock-db para mostrar datos. En producción con DB real, estas páginas seguirán mostrando datos mock hasta que sean actualizadas para usar los repositorios Prisma directamente. Esto es correcto para esta fase.

## Tests y desarrollo sin Supabase

```bash
# .env.local
MOCK_AUTH=true

# Ejecutar tests con un usuario específico
curl -H "x-user-id: usr_a_owner" http://localhost:3000/api/members

# Usuarios disponibles en mock
usr_a_owner  — Owner de CrossBox Centro
usr_a_mgr    — Manager de CrossBox Centro  
usr_a_c1     — Coach Sergio (cph_a1)
usr_a_c2     — Coach Elena (cph_a2)
usr_b_owner  — Owner de Box Norte
```
