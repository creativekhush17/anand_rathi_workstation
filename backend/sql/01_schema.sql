-- ============================================================
-- AnandRathi Workstation -- Core Schema
-- Run this before 02_rls_policies.sql and 03_stored_procedures.sql
-- ============================================================

CREATE TABLE branches (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    region      VARCHAR(100) NOT NULL
);

CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE modules (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) UNIQUE NOT NULL,   -- 'clients', 'portfolio', 'compliance' ...
    label       VARCHAR(100) NOT NULL
);

CREATE TABLE permissions (
    id          SERIAL PRIMARY KEY,
    module_id   INT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    action      VARCHAR(20) NOT NULL,          -- view / create / edit / delete / approve / export
    UNIQUE (module_id, action)
);

CREATE TABLE role_permissions (
    role_id       INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE users (
    id             SERIAL PRIMARY KEY,
    employee_id    VARCHAR(20) UNIQUE NOT NULL,   -- e.g. AR-RM-8041
    name           VARCHAR(100) NOT NULL,
    email          VARCHAR(150) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    branch_id      INT REFERENCES branches(id),
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    mfa_secret     VARCHAR(64),
    mfa_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE user_roles (
    user_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id  INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE clients (
    id             SERIAL PRIMARY KEY,
    client_ref     VARCHAR(20) UNIQUE NOT NULL,   -- e.g. AR-C-106
    name           VARCHAR(100) NOT NULL,
    category       VARCHAR(10) NOT NULL,          -- HNI / UHNI / Retail
    email          VARCHAR(150),
    phone          VARCHAR(20),
    city           VARCHAR(50),
    branch_id      INT REFERENCES branches(id),
    total_aum      NUMERIC(18, 2) DEFAULT 0,
    kyc_status     VARCHAR(20) NOT NULL DEFAULT 'Pending',   -- Pending / Approved / Rejected
    registered_on  TIMESTAMP NOT NULL DEFAULT now()
);

-- The table RM-level Row Level Security is built on.
CREATE TABLE client_assignments (
    rm_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id    INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    assigned_on  TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (rm_id, client_id)
);

CREATE TABLE audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     INT REFERENCES users(id),
    action      VARCHAR(50) NOT NULL,     -- LOGIN_SUCCESS, ASSIGN_CLIENT, KYC_APPROVE, ...
    module      VARCHAR(50),
    record_id   INT,
    ip_address  VARCHAR(45),
    old_value   TEXT,
    new_value   TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_client_assignments_rm ON client_assignments(rm_id);

CREATE TABLE IF NOT EXISTS documents (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    category      VARCHAR(50) NOT NULL,
    file_size     VARCHAR(20) DEFAULT '2.5 MB',
    files_count   INT DEFAULT 1,
    uploaded_by   INT REFERENCES users(id),
    created_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_threads (
    id            VARCHAR(50) PRIMARY KEY,
    client_name   VARCHAR(100) NOT NULL,
    category      VARCHAR(50) NOT NULL,
    last_msg      TEXT,
    time_str      VARCHAR(20),
    unread        BOOLEAN DEFAULT FALSE,
    updated_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id            SERIAL PRIMARY KEY,
    thread_id     VARCHAR(50) REFERENCES chat_threads(id) ON DELETE CASCADE,
    sender        VARCHAR(20) NOT NULL,
    text          TEXT NOT NULL,
    time_str      VARCHAR(20),
    created_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    due_date      VARCHAR(50),
    status        VARCHAR(20) DEFAULT 'Pending',
    priority      VARCHAR(20) DEFAULT 'Medium',
    category      VARCHAR(50) DEFAULT 'Follow-up',
    assigned_to   INT REFERENCES users(id),
    created_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS investment_products (
    id              SERIAL PRIMARY KEY,
    category        VARCHAR(50) NOT NULL,
    name            VARCHAR(150) NOT NULL,
    code            VARCHAR(50),
    nav_price       NUMERIC(12, 2),
    cagr_3yr        NUMERIC(5, 2),
    risk_rating     VARCHAR(20) DEFAULT 'Moderate'
);
