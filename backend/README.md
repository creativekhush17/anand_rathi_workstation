# AnandRathi Workstation — Backend

FastAPI + PostgreSQL backend with role-based access control (RBAC) enforced
at **two layers**:

1. **App layer** — `require_permission(module, action)` dependency checks the
   caller's role(s) against a `role_permissions` matrix before a route runs.
2. **Database layer** — Postgres Row Level Security (RLS) policies recompute
   the caller's role and client-assignment from the DB itself on every query,
   so a bug in the API code can't leak one RM's clients to another.

## 1. Local setup

```bash
# start Postgres
docker compose up -d

# python env
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env              # then edit JWT_SECRET etc.
```

## 2. Create the schema

Run these in order against the new database (psql, DBeaver, Adminer at
`localhost:8081`, whatever you use):

```bash
psql "$SYNC_DATABASE_URL" -f sql/01_schema.sql
psql "$SYNC_DATABASE_URL" -f sql/02_rls_policies.sql
psql "$SYNC_DATABASE_URL" -f sql/03_stored_procedures.sql
```

Then generate a real password hash and seed the first admin + role matrix:

```bash
python -c "from app.security import hash_password; print(hash_password('YourStrongPassword!'))"
# paste that hash into sql/04_seed_data.sql where it says <PASTE_BCRYPT_HASH_HERE>
psql "$SYNC_DATABASE_URL" -f sql/04_seed_data.sql
```

From here on, use **Alembic** for schema changes (`alembic revision --autogenerate -m "..."`,
`alembic upgrade head`) — the `01_schema.sql` file is just the baseline.

## 3. Run the API

```bash
uvicorn app.main:app --reload
# docs at http://localhost:8000/docs
```

## 4. Role matrix (starting point — confirm with your sir/business before locking it in)

| Role | Scope |
|---|---|
| Super Admin | everything |
| Branch Head | all RMs + clients in their branch, approve actions |
| Relationship Manager | only clients in `client_assignments` for them |
| Compliance Officer | Compliance module full, Clients/Documents/Reports read+export |
| Research Analyst | Research module only |
| Operations | Documents/Reports/Tasks |
| Auditor | read-only across Compliance/Clients/Portfolio/Reports/Documents |

Adding a new role/module later = new rows in `roles`/`modules`/`role_permissions`,
**no code change** — that's the point of this design.

## 5. How a request flows (example: `GET /clients`)

1. Client sends `Authorization: Bearer <JWT>` (issued by `POST /auth/login`).
2. `get_current_user_id` decodes the JWT → `user_id`.
3. `get_scoped_db` opens a transaction and runs
   `SET LOCAL app.current_user_id = <user_id>`.
4. `require_permission("clients", "view")` checks the role_permissions table
   → 403 if missing.
5. The route runs a normal `SELECT * FROM clients`. Postgres RLS silently
   filters it to only the rows this user is allowed to see, based on
   `client_assignments` or their role.

## 6. Security checklist (add before production)

- [ ] Rotate `JWT_SECRET`, store secrets in a vault/secret manager, not `.env` in git
- [ ] Enforce MFA for Admin/Compliance/Branch Head logins (`mfa_secret` column is already there)
- [ ] Rate limit `/auth/login` (e.g. slowapi / nginx) to stop brute force
- [ ] TLS everywhere (terminate at load balancer or app)
- [ ] Encrypt sensitive document files at rest (Documents module) — app-level
      encryption or an encrypted object store (S3 SSE, Azure Blob encryption)
- [ ] Least-privilege DB role for the app connection (not the Postgres superuser)
- [ ] Refresh-token rotation + revocation list (e.g. in Redis) for logout/compromise
- [ ] Structured audit log review workflow for Compliance (SEBI/KYC/FATCA obligations)
- [ ] Input validation via Pydantic on every endpoint (already the default with FastAPI)
- [ ] Automated tests specifically for cross-tenant leakage: "RM A must never
      see RM B's clients" — this is the single most important test in this system

## 7. Project layout

```
app/
  main.py            FastAPI app + router registration
  config.py           settings from .env
  database.py          async engine/session, RLS-scoped session helper
  security.py           password hashing + JWT
  dependencies.py        current user, permission checker, RLS session
  models/                 SQLAlchemy ORM models
  schemas/                 Pydantic request/response models
  routers/                  one file per module (auth.py, clients.py, ...)
alembic/                     migrations (after the SQL baseline)
sql/
  01_schema.sql        baseline DDL
  02_rls_policies.sql   Row Level Security
  03_stored_procedures.sql  privileged, audited operations
  04_seed_data.sql            roles/permissions/modules + first admin
```

## 8. Next modules to build (same pattern as `clients.py`)

Portfolio, Investments, Research, Reports, Documents, Tasks, Messages,
Compliance — each gets its own router file, its own Pydantic schemas, and
(where the module holds client-specific data) its own RLS policy following
the `clients` table pattern in `sql/02_rls_policies.sql`.
