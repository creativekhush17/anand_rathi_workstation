-- ============================================================
-- Row Level Security
-- Runs INSIDE Postgres, independent of the app code -- so even a bug in
-- FastAPI (missing a permission check, a wrong WHERE clause) cannot leak
-- one RM's client data to another RM.
-- ============================================================

-- Reads the user id the app set with `SET LOCAL app.current_user_id = ...`
-- for this transaction (see app/dependencies.py -> get_scoped_db).
CREATE OR REPLACE FUNCTION fn_current_user_id() RETURNS INT AS $$
    SELECT NULLIF(current_setting('app.current_user_id', true), '')::INT;
$$ LANGUAGE sql STABLE;

-- Recomputes the caller's roles live from user_roles/roles every time --
-- never trusts a flag set by the app layer.
CREATE OR REPLACE FUNCTION fn_user_has_role(p_user_id INT, p_role_names TEXT[]) RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = p_user_id
          AND r.name = ANY(p_role_names)
    );
$$ LANGUAGE sql STABLE;

-- --- clients table -------------------------------------------------
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;   -- applies even to the table owner

CREATE POLICY clients_select_policy ON clients
FOR SELECT
USING (
    fn_user_has_role(fn_current_user_id(), ARRAY['Super Admin', 'Branch Head', 'Compliance Officer', 'Auditor'])
    OR id IN (SELECT client_id FROM client_assignments WHERE rm_id = fn_current_user_id())
);

CREATE POLICY clients_modify_policy ON clients
FOR ALL
USING (
    fn_user_has_role(fn_current_user_id(), ARRAY['Super Admin', 'Branch Head', 'Relationship Manager'])
)
WITH CHECK (
    fn_user_has_role(fn_current_user_id(), ARRAY['Super Admin', 'Branch Head', 'Relationship Manager'])
);

-- --- client_assignments ---------------------------------------------
ALTER TABLE client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_assignments FORCE ROW LEVEL SECURITY;

CREATE POLICY assignments_select_policy ON client_assignments
FOR SELECT
USING (
    fn_user_has_role(fn_current_user_id(), ARRAY['Super Admin', 'Branch Head', 'Compliance Officer', 'Auditor'])
    OR rm_id = fn_current_user_id()
);

-- --- audit_logs: everyone can be logged, only privileged roles can read ---
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY audit_insert_policy ON audit_logs
FOR INSERT
WITH CHECK (true);   -- any authenticated session may write its own audit rows

CREATE POLICY audit_select_policy ON audit_logs
FOR SELECT
USING (
    fn_user_has_role(fn_current_user_id(), ARRAY['Super Admin', 'Compliance Officer', 'Auditor'])
    OR user_id = fn_current_user_id()   -- users can see their own activity
);
