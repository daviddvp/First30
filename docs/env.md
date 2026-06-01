# Variables de entorno — First30

## Variables requeridas

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | Producción | URL del pooler de Supabase (Transaction Mode, puerto 6543). Usada por Prisma para queries. |
| `DIRECT_URL` | Producción | URL de conexión directa (puerto 5432). Usada por Prisma para migraciones DDL. |
| `NEXT_PUBLIC_SUPABASE_URL` | Producción | URL pública del proyecto Supabase. Segura para el cliente. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Producción | Anon key de Supabase. Segura para el cliente. |
| `SUPABASE_SERVICE_ROLE_KEY` | Producción | Service role key. **Solo servidor**. Nunca exponer al cliente. |
| `JOB_SECRET` | Producción | Secret para proteger el endpoint del job de reglas. Generar con `openssl rand -hex 32`. |
| `MOCK_AUTH` | Desarrollo | Poner `"true"` para usar auth mock (sin Supabase). **Nunca en producción.** |

## Configuración local

1. Copiar `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Para desarrollo sin Supabase, dejar `MOCK_AUTH=true` y configurar solo las vars de DB.

3. Para desarrollo con Supabase real, configurar todas las vars y poner `MOCK_AUTH=false`.

## Variables de Next.js

Las variables con prefijo `NEXT_PUBLIC_` son expuestas al browser. Solo usar para datos no sensibles (URL pública, anon key).

Las variables **sin** `NEXT_PUBLIC_` solo están disponibles en el servidor:
- `DATABASE_URL` — solo servidor (Prisma)
- `DIRECT_URL` — solo servidor (migraciones)
- `SUPABASE_SERVICE_ROLE_KEY` — solo servidor (bypass RLS)
- `JOB_SECRET` — solo servidor (validación de jobs)

## Seguridad

- **Nunca** comitear `.env.local` al repositorio (ya está en `.gitignore`)
- **Nunca** usar `SUPABASE_SERVICE_ROLE_KEY` en código cliente
- **Nunca** poner `MOCK_AUTH=true` en producción
- En Vercel, configurar las variables en el panel de Settings → Environment Variables
