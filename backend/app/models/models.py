from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Text, UniqueConstraint, Numeric
)
from sqlalchemy.orm import relationship
from app.database import Base


class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)          # e.g. "Jodhpur Regional Desk"
    region = Column(String(100), nullable=False)


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)   # 'Super Admin', 'RM', 'Compliance Officer', ...
    description = Column(String(255))


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)   # 'clients', 'portfolio', 'compliance', ...
    label = Column(String(100), nullable=False)              # UI display name


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    action = Column(String(20), nullable=False)   # view / create / edit / delete / approve / export

    module = relationship("Module")

    __table_args__ = (UniqueConstraint("module_id", "action", name="uq_module_action"),)


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)
    permission_id = Column(Integer, ForeignKey("permissions.id"), primary_key=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    employee_id = Column(String(20), unique=True, nullable=False)   # e.g. AR-RM-8041
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    branch_id = Column(Integer, ForeignKey("branches.id"))
    is_active = Column(Boolean, default=True)
    mfa_secret = Column(String(64), nullable=True)
    mfa_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    branch = relationship("Branch")


class UserRole(Base):
    __tablename__ = "user_roles"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id"), primary_key=True)


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True)
    client_ref = Column(String(20), unique=True, nullable=False)   # e.g. AR-C-106
    name = Column(String(100), nullable=False)
    category = Column(String(10), nullable=False)   # HNI / UHNI / Retail
    email = Column(String(150))
    phone = Column(String(20))
    city = Column(String(50))
    branch_id = Column(Integer, ForeignKey("branches.id"))
    total_aum = Column(Numeric(18, 2), default=0)
    kyc_status = Column(String(20), default="Approved")
    registered_on = Column(DateTime, default=datetime.utcnow)


class ClientAssignment(Base):
    __tablename__ = "client_assignments"

    rm_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    client_id = Column(Integer, ForeignKey("clients.id"), primary_key=True)
    assigned_on = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(50), nullable=False)
    module = Column(String(50))
    record_id = Column(Integer, nullable=True)
    ip_address = Column(String(45), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    symbol = Column(String(20), nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(30), nullable=False)
    quantity = Column(Numeric(14, 4), nullable=False)
    buy_price = Column(Numeric(14, 2), nullable=False)
    current_price = Column(Numeric(14, 2), nullable=False)


class ResearchCall(Base):
    __tablename__ = "research_calls"

    id = Column(Integer, primary_key=True)
    call_type = Column(String(10), nullable=False)
    symbol = Column(String(20), nullable=False)
    company_name = Column(String(100), nullable=False)
    sector = Column(String(50))
    entry_price = Column(Numeric(14, 2), nullable=False)
    target_price = Column(Numeric(14, 2), nullable=False)
    stop_loss = Column(Numeric(14, 2), nullable=False)
    timeline = Column(String(50))
    rationale = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)
    file_size = Column(String(20))
    files_count = Column(Integer, default=1)
    updated_at = Column(DateTime, default=datetime.utcnow)


class ReportModel(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True)
    title = Column(String(150), nullable=False)
    report_type = Column(String(50), nullable=False)
    client_name = Column(String(100))
    status = Column(String(20), default="Generated")
    generated_on = Column(DateTime, default=datetime.utcnow)


class TaskModel(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    due_date = Column(String(50), default="Today")
    status = Column(String(20), default="Pending")
    priority = Column(String(20), default="Medium")
    created_at = Column(DateTime, default=datetime.utcnow)


class MessageModel(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    client_name = Column(String(100), nullable=False)
    category = Column(String(30), default="HNI")
    sender = Column(String(20), nullable=False) # 'client' or 'advisor'
    text = Column(Text, nullable=False)
    message_time = Column(String(50), default="Just now")
    unread = Column(Boolean, default=False)
    thread_id = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

