-- ─────────────────────────────────────────────────────────────────────────────
-- First30 — Row Level Security
--
-- LIMITACIÓN IMPORTANTE:
-- Prisma se conecta con DATABASE_URL que usa credenciales de service role o
-- conexión directa PostgreSQL. Esto BYPASSA RLS completamente.
-- La protección multi-tenant real en este proyecto viene de:
--   1. Repositorios: siempre filtran por organizationId en cada query.
--   2. Middleware: organizationId viene del usuario autenticado, nunca del cliente.
--   3. Servicios: validación de permisos con assertCan() antes de cualquier operación.
--
-- RLS en este archivo protege:
--   - Accesos directos desde Supabase JS client (browser) si se añaden en el futuro.
--   - Capa de defensa adicional ante eventuales bypasses del backend.
--
-- Ver docs/rls.md para la explicación completa de la estrategia de seguridad.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Habilitar RLS en tablas tenant-scoped ─────────────────────────────────────

ALTER TABLE organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances        ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alerts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_rules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_settings       ENABLE ROW LEVEL SECURITY;

-- ── Función helper: obtener organizationId del usuario autenticado ─────────────
-- Busca el organizationId del User interno que tiene supabase_uid = auth.uid().
-- Se usa en las policies para aislar datos por organización.

CREATE OR REPLACE FUNCTION first30_org_id()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT organization_id
  FROM users
  WHERE supabase_uid = auth.uid()::text
  LIMIT 1;
$$;

-- ── Policies: Organizations ───────────────────────────────────────────────────
-- Un usuario solo ve su propia organización.

CREATE POLICY "org_select_own"
  ON organizations FOR SELECT
  USING (id = first30_org_id());

-- ── Policies: Users ───────────────────────────────────────────────────────────

CREATE POLICY "users_select_own_org"
  ON users FOR SELECT
  USING (organization_id = first30_org_id());

-- ── Policies: CoachProfiles ───────────────────────────────────────────────────

CREATE POLICY "coach_profiles_select_own_org"
  ON coach_profiles FOR SELECT
  USING (organization_id = first30_org_id());

-- ── Policies: Members ─────────────────────────────────────────────────────────

CREATE POLICY "members_select_own_org"
  ON members FOR SELECT
  USING (organization_id = first30_org_id());

CREATE POLICY "members_insert_own_org"
  ON members FOR INSERT
  WITH CHECK (organization_id = first30_org_id());

CREATE POLICY "members_update_own_org"
  ON members FOR UPDATE
  USING (organization_id = first30_org_id());

-- ── Policies: Attendances ─────────────────────────────────────────────────────

CREATE POLICY "attendances_select_own_org"
  ON attendances FOR SELECT
  USING (organization_id = first30_org_id());

-- ── Policies: CheckIns ────────────────────────────────────────────────────────

CREATE POLICY "check_ins_select_own_org"
  ON check_ins FOR SELECT
  USING (organization_id = first30_org_id());

-- ── Policies: Tasks ───────────────────────────────────────────────────────────

CREATE POLICY "tasks_select_own_org"
  ON tasks FOR SELECT
  USING (organization_id = first30_org_id());

CREATE POLICY "tasks_insert_own_org"
  ON tasks FOR INSERT
  WITH CHECK (organization_id = first30_org_id());

CREATE POLICY "tasks_update_own_org"
  ON tasks FOR UPDATE
  USING (organization_id = first30_org_id());

-- ── Policies: RiskAlerts ──────────────────────────────────────────────────────

CREATE POLICY "risk_alerts_select_own_org"
  ON risk_alerts FOR SELECT
  USING (organization_id = first30_org_id());

CREATE POLICY "risk_alerts_insert_own_org"
  ON risk_alerts FOR INSERT
  WITH CHECK (organization_id = first30_org_id());

CREATE POLICY "risk_alerts_update_own_org"
  ON risk_alerts FOR UPDATE
  USING (organization_id = first30_org_id());

-- ── Policies: MessageTemplates ────────────────────────────────────────────────

CREATE POLICY "message_templates_select_own_org"
  ON message_templates FOR SELECT
  USING (organization_id = first30_org_id());

-- ── Policies: MessageLogs ─────────────────────────────────────────────────────

CREATE POLICY "message_logs_select_own_org"
  ON message_logs FOR SELECT
  USING (organization_id = first30_org_id());

CREATE POLICY "message_logs_insert_own_org"
  ON message_logs FOR INSERT
  WITH CHECK (organization_id = first30_org_id());

-- ── Policies: OnboardingRules ─────────────────────────────────────────────────

CREATE POLICY "onboarding_rules_select_own_org"
  ON onboarding_rules FOR SELECT
  USING (organization_id = first30_org_id());

-- ── Policies: WeeklyReports ───────────────────────────────────────────────────

CREATE POLICY "weekly_reports_select_own_org"
  ON weekly_reports FOR SELECT
  USING (organization_id = first30_org_id());

-- ── Policies: AuditLogs ───────────────────────────────────────────────────────

CREATE POLICY "audit_logs_select_own_org"
  ON audit_logs FOR SELECT
  USING (organization_id = first30_org_id());

-- ── Policies: Notes ───────────────────────────────────────────────────────────

CREATE POLICY "notes_select_own_org"
  ON notes FOR SELECT
  USING (organization_id = first30_org_id());

CREATE POLICY "notes_insert_own_org"
  ON notes FOR INSERT
  WITH CHECK (organization_id = first30_org_id());

-- ── Policies: OrgSettings ─────────────────────────────────────────────────────

CREATE POLICY "org_settings_select_own_org"
  ON org_settings FOR SELECT
  USING (organization_id = first30_org_id());

CREATE POLICY "org_settings_update_own_org"
  ON org_settings FOR UPDATE
  USING (organization_id = first30_org_id());

-- ── Notas finales ─────────────────────────────────────────────────────────────
-- Para aplicar este archivo a un proyecto Supabase existente:
--   supabase db push
-- O ejecutar manualmente en el SQL Editor de Supabase.
--
-- El service role (usado por Prisma) bypassa estas políticas.
-- Ver docs/rls.md para la estrategia completa.
