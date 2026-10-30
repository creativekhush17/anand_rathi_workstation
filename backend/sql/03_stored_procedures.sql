-- ============================================================
-- Anand Rathi Workstation - Stored Procedures (SPs)
-- All sensitive, transactional, and compliance-relevant operations
-- go through these stored procedures to enforce role permission checks
-- and automatic audit logging.
-- ============================================================

-- 1. Assign a client to a Relationship Manager (RM)
-- Used by: Clients Management Module
CREATE OR REPLACE FUNCTION sp_assign_client_to_rm(
    p_rm_id     INT,
    p_client_id INT,
    p_actor_id  INT
) RETURNS VOID AS $$
BEGIN
    IF NOT fn_user_has_role(p_actor_id, ARRAY['Super Admin', 'Branch Head']) THEN
        RAISE EXCEPTION 'Insufficient privileges to assign clients (actor_id=%)', p_actor_id;
    END IF;

    INSERT INTO client_assignments (rm_id, client_id)
    VALUES (p_rm_id, p_client_id)
    ON CONFLICT (rm_id, client_id) DO NOTHING;

    INSERT INTO audit_logs (user_id, action, module, record_id, new_value)
    VALUES (p_actor_id, 'ASSIGN_CLIENT', 'clients', p_client_id, 'rm_id=' || p_rm_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Approve a Client KYC verification
-- Used by: AML & Compliance Audit Module
CREATE OR REPLACE FUNCTION sp_approve_kyc(
    p_client_id INT,
    p_actor_id  INT,
    p_remarks   TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_old_status TEXT;
BEGIN
    IF NOT fn_user_has_role(p_actor_id, ARRAY['Super Admin', 'Compliance Officer']) THEN
        RAISE EXCEPTION 'Insufficient privileges to approve KYC (actor_id=%)', p_actor_id;
    END IF;

    SELECT kyc_status INTO v_old_status FROM clients WHERE id = p_client_id;

    UPDATE clients SET kyc_status = 'Approved' WHERE id = p_client_id;

    INSERT INTO audit_logs (user_id, action, module, record_id, old_value, new_value)
    VALUES (p_actor_id, 'KYC_APPROVE', 'compliance', p_client_id, v_old_status, 'Approved');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Register a New Client
-- Used by: Client Onboarding / Directory
CREATE OR REPLACE FUNCTION sp_register_client(
    p_name      VARCHAR,
    p_category  VARCHAR,
    p_email     VARCHAR,
    p_phone     VARCHAR,
    p_city      VARCHAR,
    p_aum       VARCHAR,
    p_actor_id  INT
) RETURNS INT AS $$
DECLARE
    v_new_id INT;
    v_ref    VARCHAR;
BEGIN
    IF NOT fn_user_has_role(p_actor_id, ARRAY['Super Admin', 'Branch Head', 'Relationship Manager']) THEN
        RAISE EXCEPTION 'Insufficient privileges to register clients (actor_id=%)', p_actor_id;
    END IF;

    INSERT INTO clients (name, category, email, phone, city, total_aum, client_ref)
    VALUES (p_name, p_category, p_email, p_phone, p_city, p_aum, 'TEMP_REF')
    RETURNING id INTO v_new_id;

    v_ref := 'AR-C-' || (100 + v_new_id);
    UPDATE clients SET client_ref = v_ref WHERE id = v_new_id;

    INSERT INTO audit_logs (user_id, action, module, record_id, new_value)
    VALUES (p_actor_id, 'REGISTER_CLIENT', 'clients', v_new_id, 'name=' || p_name || ', ref=' || v_ref);

    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Execute Portfolio Trade Order (Buy / Sell Holdings)
-- Used by: Portfolio & Wealth Management Module
CREATE OR REPLACE FUNCTION sp_execute_trade_order(
    p_client_id     INT,
    p_symbol        VARCHAR,
    p_name          VARCHAR,
    p_category      VARCHAR,
    p_quantity      NUMERIC,
    p_buy_price     NUMERIC,
    p_current_price NUMERIC,
    p_actor_id      INT
) RETURNS VOID AS $$
BEGIN
    IF NOT fn_user_has_role(p_actor_id, ARRAY['Super Admin', 'Branch Head', 'Relationship Manager']) THEN
        RAISE EXCEPTION 'Insufficient privileges to execute trades (actor_id=%)', p_actor_id;
    END IF;

    INSERT INTO holdings (client_id, symbol, name, category, quantity, buy_price, current_price)
    VALUES (p_client_id, p_symbol, p_name, p_category, p_quantity, p_buy_price, p_current_price);

    INSERT INTO audit_logs (user_id, action, module, record_id, new_value)
    VALUES (p_actor_id, 'EXECUTE_TRADE', 'portfolio', p_client_id, 'symbol=' || p_symbol || ', qty=' || p_quantity);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Create Research Call Recommendation
-- Used by: Research & Market Advisory Module
CREATE OR REPLACE FUNCTION sp_create_research_call(
    p_call_type     VARCHAR,
    p_symbol        VARCHAR,
    p_company_name  VARCHAR,
    p_sector        VARCHAR,
    p_entry_price   NUMERIC,
    p_target_price  NUMERIC,
    p_stop_loss     NUMERIC,
    p_timeline      VARCHAR,
    p_rationale     TEXT,
    p_actor_id      INT
) RETURNS INT AS $$
DECLARE
    v_new_id INT;
BEGIN
    IF NOT fn_user_has_role(p_actor_id, ARRAY['Super Admin', 'Research Analyst']) THEN
        RAISE EXCEPTION 'Insufficient privileges to create research calls (actor_id=%)', p_actor_id;
    END IF;

    INSERT INTO research_calls (call_type, symbol, company_name, sector, entry_price, target_price, stop_loss, timeline, rationale)
    VALUES (p_call_type, p_symbol, p_company_name, p_sector, p_entry_price, p_target_price, p_stop_loss, p_timeline, p_rationale)
    RETURNING id INTO v_new_id;

    INSERT INTO audit_logs (user_id, action, module, record_id, new_value)
    VALUES (p_actor_id, 'CREATE_RESEARCH_CALL', 'research', v_new_id, 'symbol=' || p_symbol || ', type=' || p_call_type);

    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Add Advisor Task
-- Used by: Dashboard & Task Management
CREATE OR REPLACE FUNCTION sp_add_task(
    p_title     VARCHAR,
    p_due_date  VARCHAR,
    p_priority  VARCHAR,
    p_actor_id  INT
) RETURNS INT AS $$
DECLARE
    v_new_id INT;
BEGIN
    INSERT INTO tasks (title, due_date, status, priority)
    VALUES (p_title, p_due_date, 'Pending', p_priority)
    RETURNING id INTO v_new_id;

    INSERT INTO audit_logs (user_id, action, module, record_id, new_value)
    VALUES (p_actor_id, 'CREATE_TASK', 'tasks', v_new_id, 'title=' || p_title);

    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. Post Advisor-Client Chat Message
-- Used by: Secure Messaging Module
CREATE OR REPLACE FUNCTION sp_post_message(
    p_client_name   VARCHAR,
    p_category      VARCHAR,
    p_sender        VARCHAR,
    p_text          TEXT,
    p_thread_id     VARCHAR,
    p_actor_id      INT
) RETURNS INT AS $$
DECLARE
    v_new_id INT;
BEGIN
    INSERT INTO messages (client_name, category, sender, text, message_time, unread, thread_id)
    VALUES (p_client_name, p_category, p_sender, p_text, 'Just now', false, p_thread_id)
    RETURNING id INTO v_new_id;

    INSERT INTO audit_logs (user_id, action, module, record_id, new_value)
    VALUES (p_actor_id, 'SEND_MESSAGE', 'messages', v_new_id, 'thread_id=' || p_thread_id);

    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 8. Upload Locker Document
-- Used by: Secure Document Locker
CREATE OR REPLACE FUNCTION sp_upload_document(
    p_name      VARCHAR,
    p_category  VARCHAR,
    p_size      VARCHAR,
    p_actor_id  INT
) RETURNS INT AS $$
DECLARE
    v_new_id INT;
BEGIN
    INSERT INTO documents (name, category, file_size, files_count)
    VALUES (p_name, p_category, p_size, 1)
    RETURNING id INTO v_new_id;

    INSERT INTO audit_logs (user_id, action, module, record_id, new_value)
    VALUES (p_actor_id, 'UPLOAD_DOCUMENT', 'documents', v_new_id, 'name=' || p_name);

    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 9. Generic Audit Logger Helper
-- Used by: System-wide background routines
CREATE OR REPLACE FUNCTION sp_log_audit(
    p_user_id   INT,
    p_action    VARCHAR,
    p_module    VARCHAR,
    p_record_id INT,
    p_old_value TEXT DEFAULT NULL,
    p_new_value TEXT DEFAULT NULL,
    p_ip        VARCHAR DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, module, record_id, old_value, new_value, ip_address)
    VALUES (p_user_id, p_action, p_module, p_record_id, p_old_value, p_new_value, p_ip);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
