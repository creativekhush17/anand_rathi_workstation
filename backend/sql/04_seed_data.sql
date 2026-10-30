-- ============================================================
-- Seed: modules, roles, permission matrix
-- Adjust to match your actual sidebar modules 1:1.
-- ============================================================

INSERT INTO modules (name, label) VALUES
    ('dashboard',   'Dashboard'),
    ('clients',     'Clients'),
    ('portfolio',   'Portfolio'),
    ('investments', 'Investments'),
    ('research',    'Research & Insights'),
    ('analytics',   'Market Analytics'),
    ('reports',     'Reports'),
    ('documents',   'Documents'),
    ('tasks',       'Tasks & Follow-ups'),
    ('messages',    'Messages'),
    ('compliance',  'Compliance'),
    ('settings',    'Settings');

INSERT INTO roles (name, description) VALUES
    ('Super Admin',        'Full system access, role & user management'),
    ('Branch Head',        'Oversees all RMs and clients within their branch/region'),
    ('Relationship Manager','Manages only their own assigned clients'),
    ('Compliance Officer', 'KYC/AML/FATCA review, audit log access, cross-branch'),
    ('Research Analyst',   'Creates/edits research & advisory calls'),
    ('Operations',         'Documents, reports, back-office processing'),
    ('Auditor',            'Read-only access to audit trail and compliance records');

-- view/create/edit/delete/approve/export permissions per module
INSERT INTO permissions (module_id, action)
SELECT m.id, a.action
FROM modules m
CROSS JOIN (VALUES ('view'), ('create'), ('edit'), ('delete'), ('approve'), ('export')) AS a(action);

-- ---- Super Admin: everything ----
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'Super Admin';

-- ---- Relationship Manager ----
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON true
JOIN modules m ON m.id = p.module_id
WHERE r.name = 'Relationship Manager'
  AND (
      (m.name IN ('dashboard','clients','portfolio','investments','research','analytics',
                   'reports','documents','tasks','messages') AND p.action IN ('view','create','edit'))
      OR (m.name = 'compliance' AND p.action = 'view')
      OR (m.name = 'settings' AND p.action = 'view')
  );

-- ---- Branch Head: RM permissions + approve + cross-client view ----
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON true
JOIN modules m ON m.id = p.module_id
WHERE r.name = 'Branch Head'
  AND m.name IN ('dashboard','clients','portfolio','investments','research','analytics',
                  'reports','documents','tasks','messages','compliance')
  AND p.action IN ('view','create','edit','approve','export');

-- ---- Compliance Officer ----
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON true
JOIN modules m ON m.id = p.module_id
WHERE r.name = 'Compliance Officer'
  AND (
      (m.name = 'compliance' AND p.action IN ('view','edit','approve','export'))
      OR (m.name IN ('clients','documents','reports') AND p.action IN ('view','export'))
      OR (m.name = 'dashboard' AND p.action = 'view')
  );

-- ---- Research Analyst ----
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON true
JOIN modules m ON m.id = p.module_id
WHERE r.name = 'Research Analyst'
  AND (
      (m.name = 'research' AND p.action IN ('view','create','edit'))
      OR (m.name IN ('dashboard','analytics') AND p.action = 'view')
  );

-- ---- Operations ----
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON true
JOIN modules m ON m.id = p.module_id
WHERE r.name = 'Operations'
  AND m.name IN ('documents','reports','tasks')
  AND p.action IN ('view','create','edit','export');

-- ---- Auditor: read-only everywhere relevant ----
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON true
JOIN modules m ON m.id = p.module_id
WHERE r.name = 'Auditor'
  AND m.name IN ('compliance','clients','portfolio','reports','documents')
  AND p.action IN ('view','export');

-- ---- Users for All Roles ----
INSERT INTO branches (name, region) 
SELECT 'Jodhpur Corporate Office', 'Rajasthan'
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Jodhpur Corporate Office');

INSERT INTO users (employee_id, name, email, password_hash, branch_id) VALUES
    ('AR-ADMIN-0001', 'System Administrator', 'admin@anandrathi.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 1),
    ('AR-RM-8041', 'Nitin Dadhich', 'nitin.dadhich@anandrathi.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 1),
    ('AR-HEAD-0001', 'Vikram Rathore', 'vikram.r@anandrathi.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 1),
    ('AR-COMP-0001', 'Anjali Sharma', 'anjali.s@anandrathi.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 1),
    ('AR-RES-0001', 'Devansh Gupta', 'devansh.g@anandrathi.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 1),
    ('AR-AUDIT-0001', 'Karan Verma', 'karan.v@anandrathi.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW', 1)
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.employee_id = 'AR-ADMIN-0001' AND r.name = 'Super Admin'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.employee_id = 'AR-RM-8041' AND r.name = 'Relationship Manager'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.employee_id = 'AR-HEAD-0001' AND r.name = 'Branch Head'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.employee_id = 'AR-COMP-0001' AND r.name = 'Compliance Officer'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.employee_id = 'AR-RES-0001' AND r.name = 'Research Analyst'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.employee_id = 'AR-AUDIT-0001' AND r.name = 'Auditor'
ON CONFLICT DO NOTHING;

-- ---- Sample Clients ----
INSERT INTO clients (client_ref, name, category, email, phone, city, total_aum, kyc_status) VALUES
    ('AR-C-101', 'Amit Patel', 'HNI', 'amit.patel@patelindustries.com', '+91 98200 12345', 'Mumbai', 2.45, 'Approved'),
    ('AR-C-102', 'Sneha Iyer', 'HNI', 'sneha.iyer@iyercapital.in', '+91 94440 98765', 'Chennai', 1.80, 'Approved'),
    ('AR-C-103', 'Rakesh Kumar', 'Retail', 'rakesh.kumar@kumarholdings.co.in', '+91 98100 55443', 'Delhi', 0.985, 'Approved'),
    ('AR-C-104', 'Priya Mehta', 'Retail', 'priya.mehta@designstudio.in', '+91 97630 22334', 'Pune', 0.752, 'Pending'),
    ('AR-C-105', 'Vikram Singh', 'HNI', 'vikram.singh@rajputanaresorts.com', '+91 94140 11223', 'Jaipur', 3.20, 'Approved'),
    ('AR-C-106', 'Rajesh Jhunjhunwala', 'UHNI', 'rajesh@rj-investments.com', '+91 98210 55555', 'Mumbai', 45.00, 'Approved'),
    ('AR-C-107', 'Ananya Sharma', 'UHNI', 'ananya.s@techinnovations.com', '+91 98860 88888', 'Bengaluru', 12.40, 'Approved'),
    ('AR-C-108', 'Devendra Goel', 'HNI', 'dgoel@goelsteel.com', '+91 98120 44332', 'Gurugram', 6.70, 'Approved'),
    ('AR-C-109', 'Kavitha Rao', 'HNI', 'kavitha.rao@rao-pharma.co.in', '+91 98490 66778', 'Hyderabad', 1.15, 'Approved'),
    ('AR-C-110', 'Meera Nair', 'Retail', 'meera.nair@nairconsulting.com', '+91 98470 33445', 'Kochi', 0.50, 'Approved')
ON CONFLICT (client_ref) DO NOTHING;

-- Assign all clients to RM Nitin Dadhich (AR-RM-8041)
INSERT INTO client_assignments (rm_id, client_id)
SELECT u.id, c.id
FROM users u CROSS JOIN clients c
WHERE u.employee_id = 'AR-RM-8041'
ON CONFLICT DO NOTHING;

-- ---- Sample Holdings ----
INSERT INTO holdings (client_id, symbol, name, category, quantity, buy_price, current_price) VALUES
    ((SELECT id FROM clients WHERE client_ref = 'AR-C-106' LIMIT 1), 'RELIANCE', 'Reliance Industries Ltd.', 'Equity', 500, 2200.00, 2432.15),
    ((SELECT id FROM clients WHERE client_ref = 'AR-C-106' LIMIT 1), 'HDFCBANK', 'HDFC Bank Ltd.', 'Equity', 1200, 1500.00, 1654.80),
    ((SELECT id FROM clients WHERE client_ref = 'AR-C-101' LIMIT 1), 'TCS', 'Tata Consultancy Services', 'Equity', 250, 3400.00, 3820.40)
ON CONFLICT DO NOTHING;

-- ---- Sample Research Calls ----
INSERT INTO research_calls (call_type, symbol, company_name, sector, entry_price, target_price, stop_loss, timeline, rationale) VALUES
    ('BUY', 'RELIANCE', 'Reliance Industries Ltd.', 'Energy & Telecom', 2432.15, 2850.00, 2250.00, '6 Months', 'Strong retail growth and green energy initiatives expanding EBITDA margins.'),
    ('BUY', 'HDFCBANK', 'HDFC Bank Ltd.', 'Banking', 1654.80, 1950.00, 1520.00, '3 Months', 'Post-merger loan growth momentum and improving credit-deposit ratio.'),
    ('HOLD', 'TCS', 'Tata Consultancy Services', 'IT Services', 3820.40, 4100.00, 3600.00, '12 Months', 'Stable deal wins despite macroeconomic uncertainty in North American markets.')
ON CONFLICT DO NOTHING;

-- ---- Sample Tasks ----
INSERT INTO tasks (title, due_date, status, priority) VALUES
    ('Quarterly Portfolio Review - Rajesh Jhunjhunwala', 'Today, 2:00 PM', 'Pending', 'High'),
    ('KYC Verification Renewal - Priya Mehta', 'Today, 4:30 PM', 'Pending', 'Medium'),
    ('Send Wealth Allocation Proposal - Ananya Sharma', 'Tomorrow', 'Pending', 'Medium'),
    ('Tax Loss Harvesting Strategy Brief', '10 Aug 2026', 'Completed', 'Low')
ON CONFLICT DO NOTHING;

-- ---- Sample Messages ----
INSERT INTO messages (client_name, category, sender, text, message_time, unread, thread_id) VALUES
    ('Rajesh Jhunjhunwala', 'UHNI', 'client', 'Hi Nitin, please send me the latest PMS performance report for Q2.', '10:15 AM', true, 't1'),
    ('Rajesh Jhunjhunwala', 'UHNI', 'advisor', 'Sure Mr. Jhunjhunwala, I will prepare and share the detailed report shortly.', '10:18 AM', false, 't1'),
    ('Ananya Sharma', 'UHNI', 'client', 'Hello, can we schedule a call tomorrow to discuss REITs allocation?', ' Yesterday', true, 't2')
ON CONFLICT DO NOTHING;

-- ---- Sample Documents ----
INSERT INTO documents (name, category, file_size, files_count) VALUES
    ('KYC Verification & Identity Records', 'KYC & Identity', '3.4 MB', 3),
    ('HNI Wealth Agreement 2026', 'Legal', '1.8 MB', 1),
    ('Q2 Portfolio Risk Assessment', 'Compliance', '5.2 MB', 2)
ON CONFLICT DO NOTHING;

-- ---- Sample Reports ----
INSERT INTO reports (title, report_type, client_name, status) VALUES
    ('Quarterly Portfolio Valuation Brief', 'Portfolio Performance', 'Rajesh Jhunjhunwala', 'Ready'),
    ('Annual Wealth Tax Statement 2026', 'Tax & Compliance', 'Ananya Sharma', 'Ready')
ON CONFLICT DO NOTHING;



